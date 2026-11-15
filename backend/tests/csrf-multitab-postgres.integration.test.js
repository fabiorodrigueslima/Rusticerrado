import { createHash, randomBytes, randomUUID } from 'node:crypto'
import pg from 'pg'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { adminLoginRateLimit, customerRegistrationRateLimit, customerAuthRateLimit } from '../src/security/httpSecurity.js'
import { hashPassword } from '../src/security/password.js'

const origin = 'http://localhost:5173'
const password = 'Multi tab password 123!'
const hash = value => createHash('sha256').update(value).digest('hex')
const sessionCookie = response => response.headers['set-cookie'].map(value => value.split(';')[0]).join('; ')
let admin, adminId, originalMinutes
const customers = []

beforeAll(async () => {
  const url = new URL(process.env.TEST_DATABASE_ADMIN_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local _test database required')
  admin = new pg.Client({ connectionString: url.toString() })
  await admin.connect()
  adminId = (await admin.query({ text: "INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,'Owner multiaba',$2,'OWNER') RETURNING id", values: [`owner-${randomUUID()}@example.invalid`, await hashPassword(password)] })).rows[0].id
  originalMinutes = (await admin.query("SELECT valor FROM app.configuracoes WHERE chave='checkout.reservation_minutes'")).rows[0].valor
})
beforeEach(async () => {
  for (const limiter of [adminLoginRateLimit, customerRegistrationRateLimit, customerAuthRateLimit]) for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1']) await limiter.resetKey(ip)
})
afterAll(async () => {
  if (!admin) return
  await admin.query({ text: "UPDATE app.configuracoes SET valor=$1::jsonb,atualizado_por=NULL WHERE chave='checkout.reservation_minutes'", values: [JSON.stringify(originalMinutes)] })
  await admin.query({ text: 'DELETE FROM app.audit_logs WHERE admin_id=$1', values: [adminId] })
  await admin.query({ text: 'DELETE FROM app.sessoes WHERE admin_id=$1', values: [adminId] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=$1', values: [adminId] })
  await admin.query({ text: 'DELETE FROM app.cliente_sessoes WHERE cliente_id=ANY($1::bigint[])', values: [customers] })
  await admin.query({ text: 'DELETE FROM app.clientes WHERE id=ANY($1::bigint[])', values: [customers] })
  await admin.end()
})

const adminEmail = async () => (await admin.query({ text: 'SELECT email FROM app.usuarios_admin WHERE id=$1', values: [adminId] })).rows[0].email
const updateSettings = (cookie, csrf, minutes) => request(app).put('/api/v1/admin/settings').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ reservationMinutes: minutes })

describe('CSRF across multiple tabs with real sessions', () => {
  it('gives every admin tab the same token and accepts concurrent mutations from all of them', async () => {
    const login = await request(app).post('/api/v1/admin/auth/login').send({ email: await adminEmail(), password })
    expect(login.status).toBe(200)
    const cookie = sessionCookie(login)
    const tabs = await Promise.all([1, 2, 3].map(() => request(app).get('/api/v1/admin/auth/me').set('Cookie', cookie)))
    for (const tab of tabs) expect(tab.body.data.csrfToken).toBe(login.body.data.csrfToken)
    const results = await Promise.all(tabs.map((tab, index) => updateSettings(cookie, tab.body.data.csrfToken, 30 + index)))
    expect(results.map(result => result.status)).toEqual([200, 200, 200])
    // Opening another tab afterwards still keeps the first one valid.
    await request(app).get('/api/v1/admin/auth/me').set('Cookie', cookie)
    expect((await updateSettings(cookie, tabs[0].body.data.csrfToken, 30)).status).toBe(200)
  })

  it('refuses to turn on online sales while payment or email are missing, and always allows turning them off', async () => {
    const login = await request(app).post('/api/v1/admin/auth/login').send({ email: await adminEmail(), password })
    const cookie = sessionCookie(login)
    const csrf = login.body.data.csrfToken
    const toggle = (value) => request(app).put('/api/v1/admin/settings').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', csrf).send({ checkoutEnabled: value })
    const refused = await toggle(true)
    expect(refused.status).toBe(409)
    expect(refused.body.error.code).toBe('SALES_NOT_READY')
    expect(refused.body.error.message).toContain('Mercado Pago')
    const off = await toggle(false)
    expect(off.status).toBe(200)
    expect(off.body.data).toEqual({ checkoutEnabled: false })
    const settings = await request(app).get('/api/v1/admin/settings').set('Cookie', cookie)
    expect(settings.body.sales.ready).toBe(false)
  })

  it('keeps rejecting missing, forged and cross-session admin tokens', async () => {
    const email = await adminEmail()
    const first = await request(app).post('/api/v1/admin/auth/login').send({ email, password })
    const second = await request(app).post('/api/v1/admin/auth/login').send({ email, password })
    expect(first.body.data.csrfToken).not.toBe(second.body.data.csrfToken)
    expect((await updateSettings(sessionCookie(first), '', 30)).body.error.code).toBe('CSRF_INVALID')
    expect((await updateSettings(sessionCookie(first), randomBytes(32).toString('base64url'), 30)).body.error.code).toBe('CSRF_INVALID')
    expect((await updateSettings(sessionCookie(first), second.body.data.csrfToken, 30)).body.error.code).toBe('CSRF_INVALID')
    const foreignOrigin = await request(app).put('/api/v1/admin/settings').set('Origin', 'https://attacker.example').set('Cookie', sessionCookie(first)).set('X-CSRF-Token', first.body.data.csrfToken).send({ reservationMinutes: 30 })
    expect(foreignOrigin.status).toBe(403)
    const logout = await request(app).post('/api/v1/admin/auth/logout').set('Origin', origin).set('Cookie', sessionCookie(first)).set('X-CSRF-Token', first.body.data.csrfToken)
    expect(logout.status).toBe(204)
    expect((await updateSettings(sessionCookie(first), first.body.data.csrfToken, 30)).status).toBe(401)
  })

  it('migrates an admin session created with the previous random token once', async () => {
    const token = randomBytes(32).toString('base64url')
    await admin.query({ text: "INSERT INTO app.sessoes(admin_id,token_hash,csrf_secret_hash,ip_hash,user_agent_hash,expira_em) VALUES($1,$2,$3,$4,$4,now()+interval '1 hour')", values: [adminId, hash(token), hash('legacy-random'), hash('x')] })
    const cookie = `bdp_admin=${token}`
    const tabA = await request(app).get('/api/v1/admin/auth/me').set('Cookie', cookie)
    const tabB = await request(app).get('/api/v1/admin/auth/me').set('Cookie', cookie)
    expect(tabA.body.data.csrfToken).toBe(tabB.body.data.csrfToken)
    expect((await updateSettings(cookie, tabA.body.data.csrfToken, 30)).status).toBe(200)
    expect((await updateSettings(cookie, 'legacy-random', 30)).body.error.code).toBe('CSRF_INVALID')
  })

  it('keeps the customer checkout token valid when the account is opened in another tab', async () => {
    const register = await request(app).post('/api/v1/customers/auth/register').send({ name: 'Cliente multiaba', email: `tab-${randomUUID()}@example.invalid`, phone: '11999999999', password })
    expect(register.status).toBe(201)
    customers.push(register.body.data.user.id)
    const cookie = sessionCookie(register)
    const tabs = await Promise.all([1, 2].map(() => request(app).get('/api/v1/customers/me').set('Cookie', cookie)))
    for (const tab of tabs) expect(tab.body.data.csrfToken).toBe(register.body.data.csrfToken)
    const updates = await Promise.all(tabs.map((tab, index) => request(app).put('/api/v1/customers/profile').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', tab.body.data.csrfToken).send({ name: `Cliente aba ${index}`, phone: '11999999999' })))
    expect(updates.map(update => update.status)).toEqual([200, 200])
    const forged = await request(app).put('/api/v1/customers/profile').set('Origin', origin).set('Cookie', cookie).set('X-CSRF-Token', 'forged').send({ name: 'Ataque', phone: '11999999999' })
    expect(forged.body.error.code).toBe('CSRF_INVALID')
  })
})
