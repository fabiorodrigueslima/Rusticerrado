import { createHash } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createOrderRepository } from "../src/repositories/orderRepository.js";
import { createPaymentRepository } from "../src/repositories/paymentRepository.js";

// Repositories run as the runtime role (rustic_app) so missing grants fail here too.
const { Client } = pg;
const adminUrl = process.env.TEST_DATABASE_ADMIN_URL;
const runtimeUrl = process.env.TEST_DATABASE_URL;
const suffix = `${process.pid}-${Date.now()}`;
const hash = (value) => createHash("sha256").update(value).digest("hex");
let admin, customerId, productId, orderRepo, paymentRepo;
const variants = [];
let sequence = 0;

async function tx(work) {
  const client = new Client({ connectionString: runtimeUrl });
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function variant(stock = 1) {
  const id = Number((await admin.query({ text: `INSERT INTO app.produto_variantes(produto_id,sku,nome,preco,estoque,ativa) VALUES($1,$2,'Teste',100,$3,TRUE) RETURNING id`, values: [productId, `INC-${suffix}-${variants.length}`, stock] })).rows[0].id);
  variants.push(id);
  return id;
}

async function order() {
  const variantId = await variant();
  const code = `RC-8${String(++sequence).padStart(15, "0")}`;
  const accessToken = `token-${code}-${suffix}`;
  const created = await orderRepo.create({
    keyHash: hash(`key-${code}-${suffix}`), requestHash: hash(`req-${code}`), publicCode: code, accessToken, accessTokenHash: hash(accessToken), customerId,
    customer: { name: "Cliente Teste", email: `inc-${suffix}@example.com`, phone: "61999999999" },
    address: { postalCode: "72000000", street: "Rua", number: "1", complement: "", neighborhood: "Centro", city: "Brasília", state: "DF" },
    quote: { subtotal: "100.00", shipping: "10.00", total: "110.00", selectedShipping: { service: "Teste", carrier: null, estimatedDays: 7 }, items: [{ variantId, quantity: 1, unitPrice: "100.00", subtotal: "100.00" }] },
  });
  const id = (await admin.query({ text: "SELECT id FROM app.pedidos WHERE codigo_publico=$1", values: [code] })).rows[0].id;
  return { ...created, id, variantId, accessToken, tokenHash: hash(accessToken) };
}

async function readyPayment(orderId, key) {
  await admin.query({ text: `INSERT INTO app.pagamentos(pedido_id,provedor,idempotency_key,status,metodo,valor,initiation_state,checkout_url) VALUES($1,'sandbox',$2,'PENDING','PIX',110,'READY','https://checkout.test')`, values: [orderId, key] });
}

const event = (reference, paymentId, attemptKey, status = "APPROVED", amount = "110.00") => ({
  provider: "sandbox", eventId: `evt-inc-${suffix}-${paymentId}-${status}-${amount}`, paymentId, attemptKey, reference, type: "payment.updated", status, amount, currency: "BRL", payloadHash: hash(paymentId),
});

const incidents = async (orderId) => (await admin.query({ text: "SELECT tipo,status,status_pedido,valor::text FROM app.pagamento_ocorrencias WHERE pedido_id=$1 ORDER BY id", values: [orderId] })).rows;
const payments = async (orderId) => (await admin.query({ text: "SELECT gateway_payment_id,status,aprovado_em IS NOT NULL aprovado FROM app.pagamentos WHERE pedido_id=$1 ORDER BY id", values: [orderId] })).rows;
const orderStatus = async (orderId) => (await admin.query({ text: "SELECT status FROM app.pedidos WHERE id=$1", values: [orderId] })).rows[0].status;

describe("payment incidents and recovery with isolated PostgreSQL", () => {
  beforeAll(async () => {
    if (!adminUrl || !runtimeUrl || !new URL(runtimeUrl).pathname.slice(1).endsWith("_test")) throw new Error("Exige banco _test");
    admin = new Client({ connectionString: adminUrl });
    await admin.connect();
    await admin.query("UPDATE app.configuracoes SET valor='true'::jsonb WHERE chave='checkout.enabled'");
    customerId = (await admin.query({ text: `INSERT INTO app.clientes(email,nome,sobrenome,telefone,password_hash) VALUES($1,'Cliente Teste','','61999999999','test-hash') RETURNING id`, values: [`inc-${suffix}@example.com`] })).rows[0].id;
    productId = (await admin.query({ text: `INSERT INTO app.produtos(nome,slug,descricao,status) VALUES('Produto incidente',$1,'Teste','ACTIVE') RETURNING id`, values: [`produto-incidente-${suffix}`] })).rows[0].id;
    orderRepo = createOrderRepository(tx);
    paymentRepo = createPaymentRepository(tx);
  });

  afterAll(async () => {
    if (!admin) return;
    const orders = "(SELECT id FROM app.pedidos WHERE codigo_publico LIKE 'RC-8%')";
    for (const table of ["pagamento_ocorrencias", "pagamentos", "movimentos_estoque", "reservas_estoque", "pedido_status_historico", "pedido_itens"])
      await admin.query(`DELETE FROM app.${table} WHERE pedido_id IN ${orders}`);
    await admin.query({ text: "DELETE FROM app.webhook_eventos WHERE gateway_event_id LIKE $1", values: [`evt-inc-${suffix}%`] });
    await admin.query(`DELETE FROM app.idempotency_keys WHERE recurso_id IN (SELECT id::text FROM app.pedidos WHERE codigo_publico LIKE 'RC-8%')`);
    await admin.query(`DELETE FROM app.email_outbox WHERE event_key LIKE ANY(ARRAY(SELECT 'order-received:'||id FROM app.pedidos WHERE codigo_publico LIKE 'RC-8%' UNION ALL SELECT 'payment-confirmed:'||id FROM app.pedidos WHERE codigo_publico LIKE 'RC-8%' UNION ALL SELECT 'ops-alert:order-paid:'||id FROM app.pedidos WHERE codigo_publico LIKE 'RC-8%'))`);
    await admin.query("DELETE FROM app.pedidos WHERE codigo_publico LIKE 'RC-8%'");
    await admin.query({ text: "DELETE FROM app.produto_variantes WHERE id=ANY($1)", values: [variants] });
    await admin.query({ text: "DELETE FROM app.produtos WHERE id=$1", values: [productId] });
    await admin.query({ text: "DELETE FROM app.clientes WHERE id=$1", values: [customerId] });
    await admin.end();
  });

  it("keeps the pieces reserved while a boleto can still be paid, then confirms it", async () => {
    const created = await order();
    const key = `attempt-boleto-${suffix}`;
    await readyPayment(created.id, key);
    const payableUntil = new Date(Date.now() + 3 * 86400000).toISOString();
    const pending = { ...event(created.code, `pay-boleto-${suffix}`, key, "PENDING"), paymentType: "ticket", payableUntil };
    await expect(paymentRepo.processWebhook(pending)).resolves.toEqual({ processed: true });
    const until = (await admin.query({ text: "SELECT expira_em FROM app.reservas_estoque WHERE pedido_id=$1", values: [created.id] })).rows[0].expira_em;
    // Due date plus the days a bank takes to confirm the boleto.
    expect(new Date(until).getTime()).toBeGreaterThan(Date.parse(payableUntil) + 3 * 86400000);
    await orderRepo.expireReservations();
    expect(await orderStatus(created.id)).toBe("PENDING_PAYMENT");
    await expect(paymentRepo.processWebhook(event(created.code, `pay-boleto-${suffix}`, key))).resolves.toEqual({ approved: true });
    expect(await orderStatus(created.id)).toBe("PAID");
  });

  it("does not extend the reservation for a pending Pix", async () => {
    const created = await order();
    const key = `attempt-pix-${suffix}`;
    await readyPayment(created.id, key);
    const before = (await admin.query({ text: "SELECT expira_em FROM app.reservas_estoque WHERE pedido_id=$1", values: [created.id] })).rows[0].expira_em;
    const pending = { ...event(created.code, `pay-pix-${suffix}`, key, "PENDING"), paymentType: "bank_transfer", payableUntil: new Date(Date.now() + 86400000).toISOString() };
    await expect(paymentRepo.processWebhook(pending)).resolves.toEqual({ processed: true });
    const after = (await admin.query({ text: "SELECT expira_em FROM app.reservas_estoque WHERE pedido_id=$1", values: [created.id] })).rows[0].expira_em;
    expect(new Date(after).getTime()).toBe(new Date(before).getTime());
  });

  it("records a payment approved after the order was cancelled without touching stock", async () => {
    const created = await order();
    await readyPayment(created.id, `attempt-late-${suffix}`);
    await admin.query({ text: "UPDATE app.reservas_estoque SET expira_em=now()-interval '1 minute' WHERE pedido_id=$1", values: [created.id] });
    await orderRepo.expireReservations();
    expect(await orderStatus(created.id)).toBe("CANCELLED");

    const late = event(created.code, `pay-late-${suffix}`, `attempt-late-${suffix}`);
    await expect(paymentRepo.processWebhook(late)).resolves.toEqual({ latePayment: true, incident: { type: "LATE_PAYMENT", created: true, reference: created.code } });
    await expect(paymentRepo.processWebhook(late)).resolves.toEqual({ duplicate: true });
    await expect(paymentRepo.processWebhook({ ...late, eventId: `${late.eventId}-retry` })).resolves.toEqual({ duplicateState: true });

    expect(await orderStatus(created.id)).toBe("CANCELLED");
    expect(await payments(created.id)).toEqual([{ gateway_payment_id: `pay-late-${suffix}`, status: "APPROVED", aprovado: false }]);
    expect(await incidents(created.id)).toEqual([{ tipo: "LATE_PAYMENT", status: "OPEN", status_pedido: "CANCELLED", valor: "110.00" }]);
    expect((await admin.query({ text: "SELECT estoque,estoque_reservado FROM app.produto_variantes WHERE id=$1", values: [created.variantId] })).rows[0]).toEqual({ estoque: 1, estoque_reservado: 0 });

    // Refunding the late payment closes the money trail but never rewrites the order.
    await expect(paymentRepo.processWebhook(event(created.code, `pay-late-${suffix}`, `attempt-late-${suffix}`, "REFUNDED"))).resolves.toEqual({ processed: true });
    expect(await orderStatus(created.id)).toBe("CANCELLED");
    expect((await payments(created.id))[0].status).toBe("REFUNDED");
  });

  it("records an approval that arrives after the reservation lapsed but before the expiry job", async () => {
    const created = await order();
    await readyPayment(created.id, `attempt-lapse-${suffix}`);
    await admin.query({ text: "UPDATE app.reservas_estoque SET expira_em=now()-interval '1 minute' WHERE pedido_id=$1", values: [created.id] });
    await expect(paymentRepo.processWebhook(event(created.code, `pay-lapse-${suffix}`, `attempt-lapse-${suffix}`))).resolves.toMatchObject({ latePayment: true, incident: { type: "RESERVATION_EXPIRED", created: true } });
    expect(await incidents(created.id)).toEqual([{ tipo: "RESERVATION_EXPIRED", status: "OPEN", status_pedido: "PENDING_PAYMENT", valor: "110.00" }]);
  });

  it("opens an incident instead of confirming an order paid with a divergent amount", async () => {
    const created = await order();
    await readyPayment(created.id, `attempt-amount-${suffix}`);
    await expect(paymentRepo.processWebhook(event(created.code, `pay-amount-${suffix}`, `attempt-amount-${suffix}`, "APPROVED", "11.00"))).resolves.toMatchObject({ rejected: true, incident: { type: "AMOUNT_MISMATCH" } });
    expect(await orderStatus(created.id)).toBe("PENDING_PAYMENT");
    expect(await incidents(created.id)).toEqual([{ tipo: "AMOUNT_MISMATCH", status: "OPEN", status_pedido: "PENDING_PAYMENT", valor: "11.00" }]);
  });

  it("flags a duplicate charge and keeps the paid order when the duplicate is refunded", async () => {
    const created = await order();
    const key = `attempt-dup-${suffix}`;
    await readyPayment(created.id, key);
    await expect(paymentRepo.processWebhook(event(created.code, `pay-dup1-${suffix}`, key))).resolves.toEqual({ approved: true });
    const saleAlert = await admin.query({ text: "SELECT recipient,variables FROM app.email_outbox WHERE event_key=$1", values: [`ops-alert:order-paid:${created.id}`] });
    expect(saleAlert.rows).toEqual([{ recipient: "alertas-loja@example.invalid", variables: expect.objectContaining({ kind: "ORDER_PAID", reference: created.code }) }]);
    await expect(paymentRepo.processWebhook(event(created.code, `pay-dup2-${suffix}`, key))).resolves.toMatchObject({ latePayment: true, incident: { type: "LATE_PAYMENT" } });
    await expect(paymentRepo.processWebhook(event(created.code, `pay-dup2-${suffix}`, key, "REFUNDED"))).resolves.toEqual({ processed: true });
    expect(await orderStatus(created.id)).toBe("PAID");
    expect(await payments(created.id)).toEqual([
      { gateway_payment_id: `pay-dup1-${suffix}`, status: "APPROVED", aprovado: true },
      { gateway_payment_id: `pay-dup2-${suffix}`, status: "REFUNDED", aprovado: false },
    ]);
    expect(await incidents(created.id)).toEqual([{ tipo: "LATE_PAYMENT", status: "OPEN", status_pedido: "PAID", valor: "110.00" }]);
  });

  it("opens a review incident when a fulfilled order is charged back", async () => {
    const created = await order();
    const key = `attempt-cb-${suffix}`;
    await readyPayment(created.id, key);
    await paymentRepo.processWebhook(event(created.code, `pay-cb-${suffix}`, key));
    await expect(paymentRepo.processWebhook(event(created.code, `pay-cb-${suffix}`, key, "CHARGEBACK"))).resolves.toMatchObject({ processed: true, incident: { type: "CHARGEBACK", created: true } });
    expect(await orderStatus(created.id)).toBe("CHARGEBACK");
  });

  it("aligns the payment deadline with the reservation and recovers an attempt whose link was never delivered", async () => {
    const created = await order();
    const input = { code: created.code, tokenHash: created.tokenHash, provider: "sandbox", idempotencyKey: `recover-${suffix}-0001`, method: "PIX", amount: "110.00" };
    const first = await paymentRepo.prepare(input);
    const reservation = (await admin.query({ text: "SELECT min(expira_em) expira_em FROM app.reservas_estoque WHERE pedido_id=$1", values: [created.id] })).rows[0].expira_em;
    expect(first.expiresAt.toISOString()).toBe(reservation.toISOString());

    // A request still in flight blocks a parallel attempt with another key.
    await expect(paymentRepo.prepare({ ...input, idempotencyKey: `recover-${suffix}-0002` })).rejects.toMatchObject({ code: "PAYMENT_INITIALIZATION_PENDING" });
    await expect(paymentRepo.prepare(input)).rejects.toMatchObject({ code: "PAYMENT_INITIALIZATION_PENDING" });

    // Provider timeout: the same key may retry, and the second success is persisted.
    await paymentRepo.uncertain(first.id);
    const retry = await paymentRepo.prepare(input);
    expect(retry.id).toBe(first.id);
    await paymentRepo.complete(retry.id, { preferenceId: `pref-${suffix}`, checkoutUrl: "https://checkout.test/recovered" });
    await expect(paymentRepo.prepare(input)).resolves.toMatchObject({ replayed: true, checkoutUrl: "https://checkout.test/recovered" });
  });

  it("refuses to open a checkout when the reservation is about to end", async () => {
    const created = await order();
    await admin.query({ text: "UPDATE app.reservas_estoque SET expira_em=now()+interval '1 minute' WHERE pedido_id=$1", values: [created.id] });
    await expect(paymentRepo.prepare({ code: created.code, tokenHash: created.tokenHash, provider: "sandbox", idempotencyKey: `expiring-${suffix}-0001`, method: "PIX", amount: "110.00" })).rejects.toMatchObject({ code: "RESERVATION_EXPIRING" });
    expect(await payments(created.id)).toEqual([]);
  });
});
