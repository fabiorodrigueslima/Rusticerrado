import { createHash, randomUUID } from 'node:crypto'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { transaction } from '../src/config/database.js'
import { adminRepository } from '../src/repositories/adminRepository.js'
import { orderRepository } from '../src/repositories/orderRepository.js'
import { createPaymentRepository, paymentRepository } from '../src/repositories/paymentRepository.js'
import { createPaymentService } from '../src/services/paymentService.js'
import { orderService } from '../src/services/orderService.js'

// Repositories use the runtime role. Every test checks money/stock invariants, not just results.
const hash = (value) => createHash('sha256').update(value).digest('hex')
let admin, customerId, productId, ownerId
const variants = []

async function placeOrder(stock = 1) {
  const variantId = Number((await admin.query({ text: "INSERT INTO app.produto_variantes(produto_id,sku,nome,preco,estoque,ativa) VALUES($1,$2,'Única',100,$3,TRUE) RETURNING id", values: [productId, `RES-${randomUUID()}`, stock] })).rows[0].id)
  variants.push(variantId)
  const code = `BP-6${randomUUID().replaceAll('-', '').slice(0, 15).toUpperCase()}`
  const accessToken = randomUUID()
  await orderRepository.create({
    keyHash: hash(`k-${code}`), requestHash: hash(code), publicCode: code, accessToken, accessTokenHash: hash(accessToken), customerId,
    customer: { name: 'Cliente', email: 'resiliencia@example.invalid', phone: '11999999999' },
    address: { postalCode: '01001000', street: 'Rua', number: '1', complement: '', neighborhood: 'Centro', city: 'São Paulo', state: 'SP' },
    quote: { subtotal: '100.00', shipping: '0.00', total: '100.00', selectedShipping: { service: 'Teste', carrier: null, estimatedDays: 3 }, items: [{ variantId, quantity: 1, unitPrice: '100.00', subtotal: '100.00' }] },
  })
  const id = (await admin.query({ text: 'SELECT id FROM app.pedidos WHERE codigo_publico=$1', values: [code] })).rows[0].id
  const key = `attempt-${randomUUID()}`
  await admin.query({ text: "INSERT INTO app.pagamentos(pedido_id,provedor,idempotency_key,status,metodo,valor,initiation_state,checkout_url) VALUES($1,'sandbox',$2,'PENDING','PIX',100,'READY','https://checkout.test')", values: [id, key] })
  return { id, code, accessToken, variantId, key }
}
const approved = (order, paymentId, suffix = '') => ({ provider: 'sandbox', eventId: `evt-res-${paymentId}${suffix}`, paymentId, attemptKey: order.key, reference: order.code, type: 'payment.updated', status: 'APPROVED', amount: '100.00', currency: 'BRL', payloadHash: hash(paymentId) })
const state = async (order) => (await admin.query({ text: "SELECT p.status pedido,v.estoque,v.estoque_reservado,(SELECT count(*)::integer FROM app.movimentos_estoque m WHERE m.pedido_id=p.id AND m.tipo='SALE') vendas,(SELECT count(*)::integer FROM app.pagamento_ocorrencias o WHERE o.pedido_id=p.id) ocorrencias FROM app.pedidos p JOIN app.produto_variantes v ON v.id=$2 WHERE p.id=$1", values: [order.id, order.variantId] })).rows[0]

beforeAll(async () => {
  admin = new pg.Client({ connectionString: process.env.TEST_DATABASE_ADMIN_URL })
  await admin.connect()
  await admin.query("UPDATE app.configuracoes SET valor='true'::jsonb WHERE chave='checkout.enabled'")
  customerId = (await admin.query({ text: "INSERT INTO app.clientes(email,nome,sobrenome,telefone,password_hash) VALUES($1,'Cliente','','11999999999','x') RETURNING id", values: [`res-${randomUUID()}@example.invalid`] })).rows[0].id
  productId = (await admin.query({ text: "INSERT INTO app.produtos(nome,slug,descricao,status) VALUES('Resiliência',$1,'Teste','ACTIVE') RETURNING id", values: [`res-${randomUUID()}`] })).rows[0].id
  ownerId = (await admin.query({ text: "INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,'Owner','x','OWNER') RETURNING id", values: [`res-owner-${randomUUID()}@example.invalid`] })).rows[0].id
})
afterAll(async () => {
  if (!admin) return
  const orders = '(SELECT id FROM app.pedidos WHERE cliente_id=$1)'
  for (const table of ['pagamento_ocorrencias', 'pagamentos', 'movimentos_estoque', 'reservas_estoque', 'pedido_status_historico', 'pedido_itens'])
    await admin.query({ text: `DELETE FROM app.${table} WHERE pedido_id IN ${orders}`, values: [customerId] })
  await admin.query("DELETE FROM app.webhook_eventos WHERE gateway_event_id LIKE 'evt-res-%'")
  await admin.query({ text: `DELETE FROM app.idempotency_keys WHERE recurso_id IN (SELECT id::text FROM app.pedidos WHERE cliente_id=$1)`, values: [customerId] })
  await admin.query({ text: 'DELETE FROM app.pedidos WHERE cliente_id=$1', values: [customerId] })
  await admin.query({ text: 'DELETE FROM app.produto_variantes WHERE id=ANY($1)', values: [variants] })
  await admin.query({ text: 'DELETE FROM app.produtos WHERE id=$1', values: [productId] })
  await admin.query({ text: 'DELETE FROM app.clientes WHERE id=$1', values: [customerId] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=$1', values: [ownerId] })
  await admin.end()
})

describe('payment resilience under concurrency and failures', () => {
  it('processes the same webhook delivered five times in parallel exactly once', async () => {
    const order = await placeOrder()
    const results = await Promise.all(Array.from({ length: 5 }, () => paymentRepository.processWebhook(approved(order, `pay-par-${order.id}`))))
    expect(results.filter((result) => result.approved)).toHaveLength(1)
    expect(results.filter((result) => result.duplicate)).toHaveLength(4)
    expect(await state(order)).toEqual({ pedido: 'PAID', estoque: 0, estoque_reservado: 0, vendas: 1, ocorrencias: 0 })
  })

  it('consumes stock once when different events for the same payment race', async () => {
    const order = await placeOrder()
    const results = await Promise.all([1, 2, 3].map((n) => paymentRepository.processWebhook(approved(order, `pay-race-${order.id}`, `-${n}`))))
    expect(results.filter((result) => result.approved)).toHaveLength(1)
    expect(results.filter((result) => result.duplicateState)).toHaveLength(2)
    expect(await state(order)).toMatchObject({ pedido: 'PAID', estoque: 0, vendas: 1 })
  })

  it('keeps money and stock consistent when approval races an administrative cancellation', async () => {
    for (let round = 0; round < 5; round += 1) {
      const order = await placeOrder()
      const [webhook] = await Promise.all([
        paymentRepository.processWebhook(approved(order, `pay-cancel-${order.id}`)),
        adminRepository.updateOrderStatus(order.id, 'CANCELLED', 'Cancelado pelo cliente', ownerId).catch((error) => error.code),
      ])
      const final = await state(order)
      if (webhook.approved) {
        expect(final).toEqual({ pedido: 'PAID', estoque: 0, estoque_reservado: 0, vendas: 1, ocorrencias: 0 })
      } else {
        // Cancellation won: stock was released and the captured money became an open incident.
        expect(webhook).toMatchObject({ latePayment: true, incident: { type: 'LATE_PAYMENT', created: true } })
        expect(final).toEqual({ pedido: 'CANCELLED', estoque: 1, estoque_reservado: 0, vendas: 0, ocorrencias: 1 })
      }
    }
  })

  it('rolls back everything when processing fails midway and succeeds on redelivery', async () => {
    const order = await placeOrder()
    let failNext = true
    const flaky = createPaymentRepository((work) => transaction((client) => work({
      query: (config, values) => {
        const text = typeof config === 'string' ? config : config.text
        if (failNext && text.includes("SET status='PAID'")) { failNext = false; throw new Error('connection reset') }
        return client.query(config, values)
      },
    })))
    const event = approved(order, `pay-flaky-${order.id}`)
    await expect(flaky.processWebhook(event)).rejects.toThrow('connection reset')
    expect(await state(order)).toEqual({ pedido: 'PENDING_PAYMENT', estoque: 1, estoque_reservado: 1, vendas: 0, ocorrencias: 0 })
    const recorded = await admin.query({ text: 'SELECT count(*)::integer count FROM app.webhook_eventos WHERE gateway_event_id=$1', values: [event.eventId] })
    expect(recorded.rows[0].count).toBe(0)
    // The provider retries the same event; nothing was half-applied, so it now succeeds.
    await expect(flaky.processWebhook(event)).resolves.toEqual({ approved: true })
    expect(await state(order)).toMatchObject({ pedido: 'PAID', estoque: 0, vendas: 1 })
  })

  it('recovers a checkout after the payment provider times out', async () => {
    const order = await placeOrder()
    await admin.query({ text: 'DELETE FROM app.pagamentos WHERE pedido_id=$1', values: [order.id] })
    let down = true
    const provider = { name: 'sandbox', createPayment: async ({ expiresAt }) => { if (down) throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }); return { preferenceId: `pref-${order.id}`, checkoutUrl: `https://checkout.test/${order.id}`, expiresAt } } }
    const payments = createPaymentService({ provider, repository: paymentRepository, orders: orderService })
    const request = { code: order.code, token: order.accessToken, method: 'PIX', idempotencyKey: `idem-${order.id}-0000000000` }
    await expect(payments.create(request)).rejects.toThrow('timeout')
    const unknown = await admin.query({ text: 'SELECT initiation_state FROM app.pagamentos WHERE pedido_id=$1', values: [order.id] })
    expect(unknown.rows).toEqual([{ initiation_state: 'UNKNOWN' }])
    down = false
    await expect(payments.create(request)).resolves.toMatchObject({ checkoutUrl: `https://checkout.test/${order.id}` })
    const ready = await admin.query({ text: 'SELECT initiation_state,count(*) OVER()::integer total FROM app.pagamentos WHERE pedido_id=$1', values: [order.id] })
    expect(ready.rows).toEqual([{ initiation_state: 'READY', total: 1 }])
  })

  it('queues one store alert per incident without customer data', async () => {
    const order = await placeOrder()
    await admin.query({ text: "UPDATE app.reservas_estoque SET expira_em=now()-interval '1 minute' WHERE pedido_id=$1", values: [order.id] })
    await orderRepository.expireReservations()
    const event = approved(order, `pay-alert-${order.id}`)
    await paymentRepository.processWebhook(event)
    await paymentRepository.processWebhook({ ...event, eventId: `${event.eventId}-again` })
    const incident = (await admin.query({ text: 'SELECT id FROM app.pagamento_ocorrencias WHERE pedido_id=$1', values: [order.id] })).rows[0]
    const alerts = await admin.query({ text: 'SELECT recipient,variables FROM app.email_outbox WHERE event_key=$1', values: [`ops-alert:payment-incident:${incident.id}`] })
    expect(alerts.rows).toEqual([{ recipient: 'alertas-loja@example.invalid', variables: { kind: 'PAYMENT_LATE_PAYMENT', title: expect.any(String), reference: order.code, adminSection: 'payment-incidents' } }])
  })
})
