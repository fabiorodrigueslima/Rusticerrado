import { createHash, randomUUID } from 'node:crypto'
import pg from 'pg'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { query } from '../src/config/database.js'
import { orderRepository } from '../src/repositories/orderRepository.js'
import { adminLoginRateLimit, customerAuthRateLimit, customerRegistrationRateLimit } from '../src/security/httpSecurity.js'
import { hashPassword } from '../src/security/password.js'
import { purgeExpiredCredentials } from '../src/services/jobService.js'
import { enqueuePrivacyDeadlineAlerts } from '../src/services/opsAlerts.js'

const origin = 'http://localhost:5173'
const password = 'Operations password 123!'
const hash = value => createHash('sha256').update(value).digest('hex')
const cookieOf = response => response.headers['set-cookie'].map(value => value.split(';')[0]).join('; ')
const run = randomUUID().slice(0, 8)
let admin, owner, fulfillment, productId, variantId
const created = { admins: [], customers: [], products: [] }

async function adminSession(papel) {
  const email = `${papel.toLowerCase()}-${randomUUID()}@example.invalid`
  const id = (await admin.query({ text: "INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,$2,$3,$4) RETURNING id", values: [email, `Admin ${papel}`, await hashPassword(password), papel] })).rows[0].id
  created.admins.push(id)
  const login = await request(app).post('/api/v1/admin/auth/login').send({ email, password })
  return { cookie: cookieOf(login), csrf: login.body.data.csrfToken }
}
async function customerSession() {
  const response = await request(app).post('/api/v1/customers/auth/register').send({ name: 'Cliente operações', email: `ops-${randomUUID()}@example.invalid`, phone: '11999999999', password })
  created.customers.push(response.body.data.user.id)
  return { id: response.body.data.user.id, cookie: cookieOf(response), csrf: response.body.data.csrfToken }
}
const as = (session, method, path) => request(app)[method](`/api/v1${path}`).set('Origin', origin).set('Cookie', session.cookie).set('X-CSRF-Token', session.csrf)

async function placeOrder(customerId) {
  const code = `BP-9${randomUUID().replaceAll('-', '').slice(0, 15).toUpperCase()}`
  const accessToken = randomUUID()
  await orderRepository.create({
    keyHash: hash(`key-${code}`), requestHash: hash(code), publicCode: code, accessToken, accessTokenHash: hash(accessToken), customerId,
    customer: { name: 'Cliente operações', email: 'ops@example.invalid', phone: '11999999999' },
    address: { postalCode: '01001000', street: 'Rua', number: '1', complement: '', neighborhood: 'Centro', city: 'São Paulo', state: 'SP' },
    quote: { subtotal: '100.00', shipping: '0.00', total: '100.00', selectedShipping: { service: 'Teste', carrier: null, estimatedDays: 3 }, items: [{ variantId, quantity: 1, unitPrice: '100.00', subtotal: '100.00' }] },
  })
  const id = (await admin.query({ text: 'SELECT id FROM app.pedidos WHERE codigo_publico=$1', values: [code] })).rows[0].id
  return { code, id }
}

beforeAll(async () => {
  const url = new URL(process.env.TEST_DATABASE_ADMIN_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local _test database required')
  admin = new pg.Client({ connectionString: url.toString() })
  await admin.connect()
  await admin.query("UPDATE app.configuracoes SET valor='true'::jsonb WHERE chave='checkout.enabled'")
  productId = (await admin.query({ text: "INSERT INTO app.produtos(nome,slug,descricao,status) VALUES('Operações',$1,'Teste','ACTIVE') RETURNING id", values: [`ops-${run}`] })).rows[0].id
  created.products.push(productId)
  variantId = Number((await admin.query({ text: "INSERT INTO app.produto_variantes(produto_id,sku,nome,preco,estoque,ativa) VALUES($1,$2,'Única',100,10,TRUE) RETURNING id", values: [productId, `OPS-${run}`] })).rows[0].id)
})
beforeEach(async () => {
  for (const limiter of [adminLoginRateLimit, customerAuthRateLimit, customerRegistrationRateLimit]) for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1']) await limiter.resetKey(ip)
  owner ??= await adminSession('OWNER')
  fulfillment ??= await adminSession('FULFILLMENT')
})
afterAll(async () => {
  if (!admin) return
  const orders = '(SELECT id FROM app.pedidos WHERE cliente_id=ANY($1::bigint[]))'
  for (const table of ['pagamento_ocorrencias', 'pagamentos', 'movimentos_estoque', 'reservas_estoque', 'pedido_status_historico', 'pedido_itens'])
    await admin.query({ text: `DELETE FROM app.${table} WHERE pedido_id IN ${orders}`, values: [created.customers] })
  await admin.query({ text: `DELETE FROM app.idempotency_keys WHERE recurso_id IN (SELECT id::text FROM app.pedidos WHERE cliente_id=ANY($1::bigint[]))`, values: [created.customers] })
  await admin.query({ text: `DELETE FROM app.email_outbox WHERE event_key IN (SELECT kind||id FROM app.pedidos, unnest(ARRAY['order-received:','order-shipped:']) kind WHERE cliente_id=ANY($1::bigint[]))`, values: [created.customers] })
  await admin.query({ text: 'DELETE FROM app.pedidos WHERE cliente_id=ANY($1::bigint[])', values: [created.customers] })
  await admin.query({ text: 'DELETE FROM app.privacy_request_eventos WHERE request_id IN (SELECT id FROM app.privacy_requests WHERE cliente_id=ANY($1::bigint[]))', values: [created.customers] })
  await admin.query({ text: 'DELETE FROM app.privacy_requests WHERE cliente_id=ANY($1::bigint[])', values: [created.customers] })
  await admin.query({ text: 'DELETE FROM app.cliente_sessoes WHERE cliente_id=ANY($1::bigint[])', values: [created.customers] })
  await admin.query({ text: 'DELETE FROM app.clientes WHERE id=ANY($1::bigint[])', values: [created.customers] })
  const productIds = (await admin.query({ text: "SELECT id FROM app.produtos WHERE id=ANY($1::bigint[]) OR slug LIKE $2", values: [created.products, `ops-${run}%`] })).rows.map(row => row.id)
  await admin.query({ text: 'DELETE FROM app.produto_variantes WHERE produto_id=ANY($1::bigint[])', values: [productIds] })
  await admin.query({ text: 'DELETE FROM app.produtos WHERE id=ANY($1::bigint[])', values: [productIds] })
  await admin.query({ text: 'DELETE FROM app.audit_logs WHERE admin_id=ANY($1::bigint[])', values: [created.admins] })
  await admin.query({ text: 'DELETE FROM app.sessoes WHERE admin_id=ANY($1::bigint[])', values: [created.admins] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=ANY($1::bigint[])', values: [created.admins] })
  await admin.end()
})

describe('privacy requests (LGPD) end to end', () => {
  it('tracks deadline, status, response and history, and shows the outcome to the customer', async () => {
    const customer = await customerSession()
    const opened = await as(customer, 'post', '/customers/privacy-requests').send({ type: 'ACCESS' })
    expect(opened.status).toBe(201)
    const days = (new Date(opened.body.data.prazo_em) - new Date(opened.body.data.criado_em)) / 86400000
    expect(days).toBeCloseTo(15, 0)

    const list = await as(owner, 'get', '/admin/privacy-requests?status=OPEN')
    const item = list.body.data.find(row => row.id === opened.body.data.id)
    expect(item).toMatchObject({ tipo: 'ACCESS', status: 'OPEN', atrasada: false })
    expect(item.historico).toHaveLength(1)

    expect((await as(owner, 'post', `/admin/privacy-requests/${item.id}/status`).send({ status: 'IN_REVIEW', note: 'Coletando dados' })).status).toBe(200)
    expect((await as(owner, 'post', `/admin/privacy-requests/${item.id}/status`).send({ status: 'COMPLETED', note: 'Relatório enviado por e-mail' })).body.data.status).toBe('COMPLETED')
    expect((await as(owner, 'post', `/admin/privacy-requests/${item.id}/status`).send({ status: 'DENIED', note: 'Tarde demais' })).body.error.code).toBe('INVALID_STATUS_TRANSITION')
    expect((await as(owner, 'post', `/admin/privacy-requests/${item.id}/status`).send({ status: 'DENIED' })).status).toBe(400)

    const history = (await as(owner, 'get', '/admin/privacy-requests')).body.data.find(row => row.id === item.id).historico
    expect(history.map(event => event.statusNovo)).toEqual(['OPEN', 'IN_REVIEW', 'COMPLETED'])
    const audit = await admin.query({ text: "SELECT count(*)::integer count FROM app.audit_logs WHERE acao='PRIVACY_REQUEST_UPDATE' AND recurso_id=$1 AND resultado='SUCCESS'", values: [String(item.id)] })
    expect(audit.rows[0].count).toBe(2)

    const mine = await as(customer, 'get', '/customers/privacy-requests')
    expect(mine.body.data[0]).toMatchObject({ status: 'COMPLETED', resposta: 'Relatório enviado por e-mail' })
  })

  it('applies the deadline basis per request type and alerts the store without personal data', async () => {
    const customer = await customerSession()
    const access = (await as(customer, 'post', '/customers/privacy-requests').send({ type: 'ACCESS' })).body.data
    const deletion = (await as(customer, 'post', '/customers/privacy-requests').send({ type: 'DELETION' })).body.data
    expect(access.prazo_fundamento).toBe('LGPD_ART_19_II')
    expect(deletion.prazo_fundamento).toBe('INTERNAL_TARGET')
    const received = await admin.query({ text: 'SELECT event_key,variables FROM app.email_outbox WHERE event_key=ANY($1) ORDER BY event_key', values: [[`ops-alert:privacy-received:${access.id}`, `ops-alert:privacy-received:${deletion.id}`]] })
    expect(received.rows).toHaveLength(2)
    expect(JSON.stringify(received.rows)).not.toMatch(/@example\.invalid|Cliente operações/)

    await admin.query({ text: "UPDATE app.privacy_requests SET prazo_em=now()+interval '1 day' WHERE id=$1", values: [access.id] })
    await admin.query({ text: "UPDATE app.privacy_requests SET prazo_em=now()-interval '1 day' WHERE id=$1", values: [deletion.id] })
    const first = await enqueuePrivacyDeadlineAlerts(query, 3, 'alertas-loja@example.invalid')
    const again = await enqueuePrivacyDeadlineAlerts(query, 3, 'alertas-loja@example.invalid')
    expect(first.dueSoon).toBeGreaterThanOrEqual(1)
    expect(first.overdue).toBeGreaterThanOrEqual(1)
    expect(again).toEqual({ dueSoon: 0, overdue: 0 })
    const staged = await admin.query({ text: 'SELECT event_key FROM app.email_outbox WHERE event_key=ANY($1) ORDER BY event_key', values: [[`ops-alert:privacy-due-soon:${access.id}`, `ops-alert:privacy-overdue:${deletion.id}`]] })
    expect(staged.rows).toHaveLength(2)
  })

  it('flags overdue requests and hides the queue from the fulfillment role', async () => {
    const customer = await customerSession()
    const opened = await as(customer, 'post', '/customers/privacy-requests').send({ type: 'DELETION' })
    await admin.query({ text: "UPDATE app.privacy_requests SET prazo_em=now()-interval '1 day' WHERE id=$1", values: [opened.body.data.id] })
    expect((await as(owner, 'get', '/admin/privacy-requests')).body.data.find(row => row.id === opened.body.data.id).atrasada).toBe(true)
    expect((await as(owner, 'get', '/admin/dashboard')).body.data.overdue_privacy_requests).toBeGreaterThanOrEqual(1)
    expect((await as(fulfillment, 'get', '/admin/privacy-requests')).status).toBe(403)
    expect((await as(fulfillment, 'post', `/admin/privacy-requests/${opened.body.data.id}/status`).send({ status: 'IN_REVIEW', note: 'tentativa' })).status).toBe(403)
  })
})

describe('payment incidents and orders in the admin panel', () => {
  it('lists, resolves once and exposes incidents without internal token hashes', async () => {
    const customer = await customerSession()
    const order = await placeOrder(customer.id)
    const incidentId = (await admin.query({ text: "INSERT INTO app.pagamento_ocorrencias(pedido_id,provedor,gateway_payment_id,tipo,status_pedido,valor,moeda) VALUES($1,'sandbox',$2,'LATE_PAYMENT','CANCELLED',100,'BRL') RETURNING id", values: [order.id, `pay-${run}`] })).rows[0].id
    const open = await as(owner, 'get', '/admin/payment-incidents?status=OPEN')
    expect(open.body.data.find(row => row.id === incidentId)).toMatchObject({ tipo: 'LATE_PAYMENT', codigo_publico: order.code })
    expect((await as(owner, 'get', '/admin/dashboard')).body.data.open_payment_incidents).toBeGreaterThanOrEqual(1)
    expect((await as(fulfillment, 'get', '/admin/payment-incidents')).status).toBe(403)
    expect((await as(owner, 'post', `/admin/payment-incidents/${incidentId}/resolve`).send({ resolution: 'Estornado no painel do Mercado Pago' })).status).toBe(200)
    expect((await as(owner, 'post', `/admin/payment-incidents/${incidentId}/resolve`).send({ resolution: 'De novo' })).body.error.code).toBe('INCIDENT_ALREADY_RESOLVED')
    expect((await as(owner, 'post', '/admin/payment-incidents/999999999/resolve').send({ resolution: 'Inexistente' })).status).toBe(404)

    const detail = await as(owner, 'get', `/admin/orders/${order.id}`)
    expect(detail.status).toBe(200)
    expect(detail.body.data).not.toHaveProperty('access_token_hash')
    expect(detail.body.data.incidents).toEqual([expect.objectContaining({ tipo: 'LATE_PAYMENT', status: 'RESOLVED' })])
    expect((await as(owner, 'get', '/admin/orders/999999999')).status).toBe(404)
  })

  it('requires a tracking code to ship, e-mails it once and shows it to the customer', async () => {
    const customer = await customerSession()
    const order = await placeOrder(customer.id)
    await admin.query({ text: "UPDATE app.pedidos SET status='PAID' WHERE id=$1", values: [order.id] })
    const status = (body) => as(fulfillment, 'post', `/admin/orders/${order.id}/status`).send(body)
    expect((await status({ status: 'IN_PRODUCTION', reason: 'Produzindo', trackingCode: 'AA123456789BR' })).status).toBe(400)
    expect((await status({ status: 'IN_PRODUCTION', reason: 'Produzindo' })).status).toBe(200)
    expect((await status({ status: 'READY_TO_SHIP', reason: 'Embalado' })).status).toBe(200)
    expect((await status({ status: 'SHIPPED', reason: 'Correios' })).status).toBe(400)
    expect((await status({ status: 'SHIPPED', reason: 'Correios', trackingCode: 'AA123', trackingUrl: 'http://inseguro.example' })).status).toBe(400)
    expect((await status({ status: 'SHIPPED', reason: 'Correios', trackingCode: 'aa123456789br' })).status).toBe(200)
    expect((await status({ status: 'SHIPPED', reason: 'De novo', trackingCode: 'BB123456789BR' })).body.error.code).toBe('INVALID_STATUS_TRANSITION')

    const emails = (await admin.query({ text: "SELECT template,recipient,variables FROM app.email_outbox WHERE event_key=$1", values: [`order-shipped:${order.id}`] })).rows
    expect(emails).toEqual([{ template: 'order-shipped', recipient: 'ops@example.invalid', variables: { code: order.code, trackingCode: 'AA123456789BR' } }])
    const seen = await as(customer, 'get', `/customers/orders/${order.code}`)
    expect(seen.body.data).toMatchObject({ status: 'SHIPPED', codigo_rastreio: 'AA123456789BR', rastreio_url: null })
    expect(seen.body.data.enviado_em).toBeTruthy()
  })

  it('lets only the owner reopen an order from the account, on any device', async () => {
    const buyer = await customerSession()
    const other = await customerSession()
    const order = await placeOrder(buyer.id)
    const mine = await as(buyer, 'get', `/customers/orders/${order.code}`)
    expect(mine.status).toBe(200)
    expect(mine.body.data).toMatchObject({ codigo_publico: order.code, status: 'PENDING_PAYMENT' })
    expect(mine.body.data).not.toHaveProperty('id')
    expect((await as(other, 'get', `/customers/orders/${order.code}`)).status).toBe(404)
    expect((await request(app).get(`/api/v1/customers/orders/${order.code}`)).status).toBe(401)
  })
})

describe('catalog administration integrity', () => {
  const product = (slug, sku) => ({ name: 'Produto atômico', slug, description: 'Teste', productionDays: 0, status: 'DRAFT', initialVariant: { name: 'Única', sku, price: '50.00', stock: 2, active: true, attributes: {}, weightGrams: 12, widthCm: 3, heightCm: 2, lengthCm: 4 } })

  it('creates product and first variant atomically and stores shipping measurements', async () => {
    const ok = await as(owner, 'post', '/admin/products').send(product(`ops-${run}-a`, `OPS-${run}-A`))
    expect(ok.status).toBe(201)
    const variant = (await admin.query({ text: 'SELECT peso_gramas::text,largura_cm::text,altura_cm::text,comprimento_cm::text FROM app.produto_variantes WHERE produto_id=$1', values: [ok.body.data.id] })).rows
    expect(variant).toEqual([{ peso_gramas: '12.00', largura_cm: '3.00', altura_cm: '2.00', comprimento_cm: '4.00' }])

    const duplicateSku = await as(owner, 'post', '/admin/products').send(product(`ops-${run}-b`, `OPS-${run}-A`))
    expect(duplicateSku.status).toBe(409)
    expect(duplicateSku.body.error.code).toBe('DUPLICATE_VALUE')
    expect((await admin.query({ text: 'SELECT count(*)::integer count FROM app.produtos WHERE slug=$1', values: [`ops-${run}-b`] })).rows[0].count).toBe(0)

    expect((await as(owner, 'post', '/admin/products').send(product(`ops-${run}-a`, `OPS-${run}-C`))).body.error.code).toBe('DUPLICATE_VALUE')
  })

  it('answers 404 for products that do not exist', async () => {
    const body = { name: 'Fantasma', slug: `ops-${run}-ghost`, description: '', productionDays: 0, status: 'DRAFT' }
    expect((await as(owner, 'put', '/admin/products/999999999').send(body)).status).toBe(404)
    expect((await as(owner, 'post', '/admin/products/999999999/variants').send({ name: 'X', sku: `OPS-${run}-X`, price: '1.00', stock: 0, active: true })).status).toBe(404)
  })
})

describe('credential retention with runtime permissions', () => {
  it('deletes long-expired sessions and tokens but keeps recent ones', async () => {
    const customer = await customerSession()
    const old = hash(`old-${run}`), recent = hash(`recent-${run}`)
    await admin.query({ text: "INSERT INTO app.cliente_sessoes(cliente_id,token_hash,csrf_secret_hash,criado_em,expira_em) VALUES($1,$2,$2,now()-interval '60 days',now()-interval '40 days'),($1,$3,$3,now()-interval '2 days',now()-interval '1 day')", values: [customer.id, old, recent] })
    const removed = await purgeExpiredCredentials(query)
    expect(removed.customerSessions).toBeGreaterThanOrEqual(1)
    const left = (await admin.query({ text: 'SELECT token_hash FROM app.cliente_sessoes WHERE token_hash=ANY($1)', values: [[old, recent]] })).rows.map(row => row.token_hash)
    expect(left).toEqual([recent])
  })
})
