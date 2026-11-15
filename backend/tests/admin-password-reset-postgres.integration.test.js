import { createHash, randomBytes } from 'node:crypto'
import pg from 'pg'
import request from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app.js'
import { adminLoginRateLimit } from '../src/security/httpSecurity.js'
import { hashPassword } from '../src/security/password.js'

const hash = (value) => createHash('sha256').update(value).digest('hex')
const suffix = `${process.pid}-${Date.now()}`
const email = `recupera-${suffix}@example.com`
const oldPassword = 'senha antiga muito longa'
const newPassword = 'senha nova muito longa 2'
let admin, adminId

const login = (password) => request(app).post('/api/v1/admin/auth/login').send({ email, password })
async function issueToken(minutes = 30) {
  const token = randomBytes(32).toString('base64url')
  await admin.query({ text: `INSERT INTO app.password_reset_tokens(admin_id,token_hash,expira_em) VALUES($1,$2,now()+make_interval(mins => $3))`, values: [adminId, hash(token), minutes] })
  return token
}

beforeAll(async () => {
  const url = new URL(process.env.TEST_DATABASE_ADMIN_URL)
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local _test database required')
  admin = new pg.Client({ connectionString: url.toString() })
  await admin.connect()
  adminId = (await admin.query({ text: `INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,'Recuperação',$2,'OWNER') RETURNING id`, values: [email, await hashPassword(oldPassword)] })).rows[0].id
})
beforeEach(async () => {
  for (const ip of ['127.0.0.1', '::ffff:127.0.0.1', '::1']) await adminLoginRateLimit.resetKey(ip)
})
afterAll(async () => {
  if (!admin) return
  for (const table of ['password_reset_tokens', 'sessoes', 'audit_logs']) await admin.query({ text: `DELETE FROM app.${table} WHERE admin_id=$1`, values: [adminId] })
  await admin.query({ text: `DELETE FROM app.login_throttle WHERE escopo='ADMIN' AND conta_id=$1`, values: [adminId] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=$1', values: [adminId] })
  await admin.end()
})

describe('panel "forgot password" with real PostgreSQL', () => {
  it('accepts any e-mail with the same answer and stores a 30-minute token only for real administrators', async () => {
    const known = await request(app).post('/api/v1/admin/auth/forgot').send({ email: email.toUpperCase() })
    const unknown = await request(app).post('/api/v1/admin/auth/forgot').send({ email: `ninguem-${suffix}@example.com` })
    expect(known.status).toBe(202)
    expect(unknown.status).toBe(202)
    expect(known.body).toEqual(unknown.body)
    const tokens = (await admin.query({ text: `SELECT token_hash, expira_em - criado_em AS validade FROM app.password_reset_tokens WHERE admin_id=$1 AND usado_em IS NULL`, values: [adminId] })).rows
    expect(tokens).toHaveLength(1)
    expect(tokens[0].token_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(tokens[0].validade.minutes).toBe(30)
  })

  it('sets the new password once, ends open sessions and clears lockouts', async () => {
    const session = await login(oldPassword)
    expect(session.status).toBe(200)
    const cookie = session.headers['set-cookie'].map((value) => value.split(';')[0]).join('; ')
    await admin.query({ text: `INSERT INTO app.login_throttle(escopo,conta_id,origem,falhas,janela_inicio,bloqueado_ate) VALUES('ADMIN',$1,'ALL',20,now(),now()+interval '1 hour') ON CONFLICT (escopo,conta_id,origem) DO UPDATE SET bloqueado_ate=EXCLUDED.bloqueado_ate`, values: [adminId] })

    const token = await issueToken()
    expect((await request(app).post('/api/v1/admin/auth/reset').send({ token, password: 'curta' })).status).toBe(400)
    const reset = await request(app).post('/api/v1/admin/auth/reset').send({ token, password: newPassword })
    expect(reset.status).toBe(200)
    expect((await request(app).post('/api/v1/admin/auth/reset').send({ token, password: newPassword })).body.error.code).toBe('RESET_TOKEN_INVALID')

    expect((await request(app).get('/api/v1/admin/auth/me').set('Cookie', cookie)).status).toBe(401)
    expect((await login(oldPassword)).status).toBe(401)
    expect((await login(newPassword)).status).toBe(200)
    const audits = (await admin.query({ text: `SELECT acao FROM app.audit_logs WHERE admin_id=$1 AND acao='ADMIN_PASSWORD_RESET'`, values: [adminId] })).rows
    expect(audits).toHaveLength(1)
  })

  it('refuses expired links and links replaced by a newer request', async () => {
    const expired = await issueToken(-1).catch(() => null)
    if (expired) expect((await request(app).post('/api/v1/admin/auth/reset').send({ token: expired, password: newPassword })).status).toBe(400)
    const older = await issueToken()
    await request(app).post('/api/v1/admin/auth/forgot').send({ email })
    expect((await request(app).post('/api/v1/admin/auth/reset').send({ token: older, password: newPassword })).body.error.code).toBe('RESET_TOKEN_INVALID')
  })
})
