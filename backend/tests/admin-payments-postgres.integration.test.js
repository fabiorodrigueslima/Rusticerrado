import { randomBytes, randomUUID } from 'node:crypto'
import pg from 'pg'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { adminLoginRateLimit } from '../src/security/httpSecurity.js'
import { hashPassword } from '../src/security/password.js'
import { createSecretBox } from '../src/security/secretBox.js'
import { createPaymentConnectionService } from '../src/services/paymentConnectionService.js'

const origin = 'http://localhost:5173'
const password = 'Payments password 123!'
const cookieOf = (response) => response.headers['set-cookie'].map((value) => value.split(';')[0]).join('; ')
const KEY = randomBytes(32).toString('base64')
const oauthConfig = {
  MERCADO_PAGO_CLIENT_ID: '1234567890', MERCADO_PAGO_CLIENT_SECRET: 'client-secret-only-for-tests', PAYMENT_TOKEN_KEY: KEY,
  MERCADO_PAGO_AUTH_URL: 'https://auth.mercadopago.com/authorization', MERCADO_PAGO_API_URL: 'https://api.mercadopago.com',
  PUBLIC_BACKEND_URL: 'https://www.brincosdeprincesa.com.br', EXTERNAL_REQUEST_TIMEOUT_MS: 4000,
}
let admin, owner, manager
const createdAdmins = []

async function adminSession(papel) {
  const email = `${papel.toLowerCase()}-pay-${randomUUID()}@example.invalid`
  const id = (await admin.query({ text: 'INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,$2,$3,$4) RETURNING id', values: [email, `Admin ${papel}`, await hashPassword(password), papel] })).rows[0].id
  createdAdmins.push(id)
  const login = await request(app).post('/api/v1/admin/auth/login').send({ email, password })
  return { id: Number(id), cookie: cookieOf(login), csrf: login.body.data.csrfToken }
}
const as = (session, method, path) => request(app)[method](`/api/v1${path}`).set('Origin', origin).set('Cookie', session.cookie).set('X-CSRF-Token', session.csrf)

beforeAll(async () => {
  const url = new URL(process.env.TEST_DATABASE_ADMIN_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local _test database required')
  admin = new pg.Client({ connectionString: url.toString() })
  await admin.connect()
})
beforeEach(async () => {
  for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1']) await adminLoginRateLimit.resetKey(ip)
  owner ??= await adminSession('OWNER')
  manager ??= await adminSession('MANAGER')
})
afterAll(async () => {
  if (!admin) return
  await admin.query({ text: 'DELETE FROM app.oauth_estados WHERE admin_id=ANY($1::bigint[])', values: [createdAdmins] })
  await admin.query("DELETE FROM app.integracao_pagamento WHERE provedor='mercado-pago'")
  await admin.query(`UPDATE app.configuracoes SET valor='{"pix": true, "credit": true, "debit": true, "boleto": false, "maxInstallments": 3}'::jsonb, atualizado_por=NULL WHERE chave='payments.methods'`)
  for (const table of ['audit_logs', 'sessoes']) await admin.query({ text: `DELETE FROM app.${table} WHERE admin_id=ANY($1::bigint[])`, values: [createdAdmins] })
  await admin.query({ text: "DELETE FROM app.login_throttle WHERE escopo='ADMIN' AND conta_id=ANY($1::bigint[])", values: [createdAdmins] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=ANY($1::bigint[])', values: [createdAdmins] })
  await admin.end()
})

describe('panel "Pagamentos" with real PostgreSQL', () => {
  it('shows the connection and methods only to the store owner', async () => {
    const view = await as(owner, 'get', '/admin/payments')
    expect(view.status).toBe(200)
    expect(view.body.data.connection).toMatchObject({ connected: false })
    expect(view.body.data.methods).toEqual({ pix: true, credit: true, debit: true, boleto: false, maxInstallments: 3 })
    expect((await as(manager, 'get', '/admin/payments')).status).toBe(403)
    expect((await as(manager, 'put', '/admin/payments/methods').send({ pix: true, credit: true, debit: true, boleto: true, maxInstallments: 6 })).status).toBe(403)
  })

  it('saves the chosen methods and refuses turning every method off', async () => {
    expect((await as(owner, 'put', '/admin/payments/methods').send({ pix: false, credit: false, debit: false, boleto: false, maxInstallments: 1 })).status).toBe(400)
    expect((await as(owner, 'put', '/admin/payments/methods').send({ pix: true, credit: true, debit: false, boleto: true, maxInstallments: 13 })).status).toBe(400)
    const saved = await as(owner, 'put', '/admin/payments/methods').send({ pix: true, credit: true, debit: false, boleto: true, maxInstallments: 6 })
    expect(saved.status).toBe(200)
    expect((await admin.query("SELECT valor FROM app.configuracoes WHERE chave='payments.methods'")).rows[0].valor).toEqual({ pix: true, credit: true, debit: false, boleto: true, maxInstallments: 6 })
  })

  it('always returns the browser to the panel from the Mercado Pago callback', async () => {
    const bad = await request(app).get('/api/v1/admin/payments/mercado-pago/callback').query({ code: 'TG-x', state: 'x'.repeat(43) })
    expect(bad.status).toBe(303)
    expect(bad.headers.location).toMatch(/\/admin\?pagamentos=erro$/)
    const denied = await request(app).get('/api/v1/admin/payments/mercado-pago/callback').query({ error: 'access_denied' })
    expect(denied.headers.location).toMatch(/\/admin\?pagamentos=cancelado$/)
    // Without the developer's application configured, connecting is refused with a clear message.
    expect((await as(owner, 'post', '/admin/payments/mercado-pago/connect')).body.error.code).toBe('PAYMENT_APP_NOT_CONFIGURED')
  })

  it('connects, renews and disconnects through the runtime role, storing tokens only encrypted', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ access_token: 'APP_USR-real', refresh_token: 'TG-real', user_id: 4455, live_mode: false, expires_in: 15552000 }) }))
    const service = createPaymentConnectionService({ fetchImpl, config: oauthConfig })
    const state = new URL((await service.startAuthorization(owner.id)).authorizationUrl).searchParams.get('state')
    expect(await service.completeAuthorization({ code: 'TG-code', state })).toEqual({ adminId: owner.id, accountId: '4455' })
    await expect(service.completeAuthorization({ code: 'TG-code', state })).rejects.toMatchObject({ code: 'PAYMENT_OAUTH_STATE_INVALID' })
    const stored = (await admin.query("SELECT access_token_cifrado,refresh_token_cifrado,conta_id,modo_producao FROM app.integracao_pagamento WHERE provedor='mercado-pago'")).rows[0]
    expect(stored).toMatchObject({ conta_id: '4455', modo_producao: false })
    expect(JSON.stringify(stored)).not.toMatch(/APP_USR-real|TG-real/)
    expect(createSecretBox(KEY).open(stored.access_token_cifrado)).toBe('APP_USR-real')
    expect(await service.getAccessToken()).toBe('APP_USR-real')

    await admin.query("UPDATE app.integracao_pagamento SET expira_em=now()+interval '2 days' WHERE provedor='mercado-pago'")
    fetchImpl.mockImplementationOnce(async () => ({ ok: true, json: async () => ({ access_token: 'APP_USR-renovado', refresh_token: 'TG-renovado', user_id: 4455, expires_in: 15552000 }) }))
    expect(await service.getAccessToken()).toBe('APP_USR-renovado')
    expect((await admin.query("SELECT renovado_em IS NOT NULL renovado FROM app.integracao_pagamento WHERE provedor='mercado-pago'")).rows[0].renovado).toBe(true)

    const status = await as(owner, 'get', '/admin/payments')
    expect(status.body.data.connection).toMatchObject({ connected: true, accountId: '4455', liveMode: false })
    expect(JSON.stringify(status.body)).not.toMatch(/APP_USR|TG-|cifrado/)

    expect((await as(owner, 'delete', '/admin/payments/mercado-pago')).body.data).toEqual({ disconnected: true })
    expect(await service.getAccessToken()).toBeNull()
  })
})
