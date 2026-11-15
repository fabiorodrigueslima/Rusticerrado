import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { query } from '../src/config/database.js'
import { adminAuthRepository } from '../src/repositories/adminAuthRepository.js'
import { createLoginThrottle, LOGIN_POLICY, networkOf } from '../src/security/loginThrottle.js'
import { hashPassword } from '../src/security/password.js'
import { createAdminAuthService } from '../src/services/adminAuthService.js'

// Runs against the runtime role (rustic_app) so grants on login_throttle are exercised.
const password = 'Throttle owner password 123!'
let admin, owner
const throttle = createLoginThrottle(query)
const service = createAdminAuthService(adminAuthRepository, throttle)
const login = (ip, pass = 'wrong password 123') => service.login({ email: owner.email, password: pass, requestId: 'throttle-test', ip, userAgent: 'test' })
const outcome = (promise) => promise.then(() => 'OK', (error) => error.code)
const reset = () => admin.query({ text: 'DELETE FROM app.login_throttle WHERE conta_id=$1', values: [owner.id] })

beforeAll(async () => {
  admin = new pg.Client({ connectionString: process.env.TEST_DATABASE_ADMIN_URL })
  await admin.connect()
  const email = `throttle-${randomUUID()}@example.invalid`
  owner = { email, id: (await admin.query({ text: "INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,'Owner',$2,'OWNER') RETURNING id", values: [email, await hashPassword(password)] })).rows[0].id }
})
afterAll(async () => {
  if (!admin) return
  await reset()
  await admin.query({ text: "DELETE FROM app.email_outbox WHERE event_key LIKE $1", values: [`ops-alert:admin-login-lock:${owner.id}:%`] })
  await admin.query({ text: 'DELETE FROM app.audit_logs WHERE admin_id=$1', values: [owner.id] })
  await admin.query({ text: 'DELETE FROM app.sessoes WHERE admin_id=$1', values: [owner.id] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=$1', values: [owner.id] })
  await admin.end()
})

describe('login throttling with real PostgreSQL', () => {
  it('locks only the attacking network, so the owner still signs in from elsewhere', async () => {
    await reset()
    for (let attempt = 0; attempt < LOGIN_POLICY.source.maxFailures; attempt += 1) expect(await outcome(login('203.0.113.7'))).toBe('INVALID_CREDENTIALS')
    // Correct password from the locked network is refused while the lock lasts.
    expect(await outcome(login('203.0.113.7', password))).toBe('INVALID_CREDENTIALS')
    // The real owner, on another network, is not affected.
    expect(await outcome(login('198.51.100.20', password))).toBe('OK')
    const audit = await admin.query({ text: "SELECT count(*)::integer count FROM app.audit_logs WHERE admin_id=$1 AND metadados->>'reason'='THROTTLED'", values: [owner.id] })
    expect(audit.rows[0].count).toBeGreaterThanOrEqual(1)
  })

  it('treats every address in an IPv6 /64 as the same source', async () => {
    await reset()
    for (let attempt = 0; attempt < LOGIN_POLICY.source.maxFailures; attempt += 1) await outcome(login(`2001:db8:aa:bb::${attempt + 1}`))
    expect(await outcome(login('2001:db8:aa:bb:ffff::9', password))).toBe('INVALID_CREDENTIALS')
    expect(await outcome(login('2001:db8:aa:cc::1', password))).toBe('OK')
  })

  it('doubles the lock on repeated abuse from the same source', async () => {
    await reset()
    const lockMinutes = async () => (await admin.query({ text: "SELECT round(extract(epoch FROM bloqueado_ate-now())/60)::integer minutes,bloqueios FROM app.login_throttle WHERE conta_id=$1 AND origem<>'ALL'", values: [owner.id] })).rows[0]
    for (let attempt = 0; attempt < 5; attempt += 1) await outcome(login('192.0.2.50'))
    expect(await lockMinutes()).toMatchObject({ minutes: 15, bloqueios: 1 })
    await admin.query({ text: "UPDATE app.login_throttle SET bloqueado_ate=now()-interval '1 second' WHERE conta_id=$1", values: [owner.id] })
    for (let attempt = 0; attempt < 5; attempt += 1) await outcome(login('192.0.2.50'))
    expect(await lockMinutes()).toMatchObject({ minutes: 30, bloqueios: 2 })
  })

  it('locks the whole account under a distributed attack and alerts the store', async () => {
    await reset()
    // Each source stays below its own limit; together they exceed the account-wide one.
    for (let attempt = 0; attempt < LOGIN_POLICY.account.maxFailures; attempt += 1) await outcome(login(`100.64.${Math.floor(attempt / 4)}.${attempt}`))
    expect(await outcome(login('198.51.100.20', password))).toBe('INVALID_CREDENTIALS')
    const alerts = await admin.query({ text: "SELECT template,recipient,variables FROM app.email_outbox WHERE event_key LIKE $1", values: [`ops-alert:admin-login-lock:${owner.id}:%`] })
    expect(alerts.rows).toEqual([expect.objectContaining({ template: 'ops-alert', recipient: 'alertas-loja@example.invalid', variables: expect.objectContaining({ kind: 'ADMIN_ACCOUNT_LOCKED', reference: `ADMIN-${owner.id}` }) })])
    expect(JSON.stringify(alerts.rows[0].variables)).not.toContain(owner.email)
  })

  it('does not let a valid login reset the account-wide counter, and counts concurrent failures once each', async () => {
    await reset()
    await Promise.all(Array.from({ length: 10 }, (_, index) => outcome(login(`172.16.0.${index}`))))
    expect(await outcome(login('198.51.100.30', password))).toBe('OK')
    const account = await admin.query({ text: "SELECT falhas FROM app.login_throttle WHERE conta_id=$1 AND origem='ALL'", values: [owner.id] })
    expect(account.rows[0].falhas).toBe(10)
  })

  it('normalizes network keys', () => {
    expect(networkOf('::ffff:203.0.113.7')).toBe('203.0.113.7')
    expect(networkOf('2001:db8:aa:bb::1')).toBe(networkOf('2001:0db8:00aa:00bb:1:2:3:4'))
    expect(networkOf('2001:db8:aa:bb::1')).not.toBe(networkOf('2001:db8:aa:bc::1'))
  })
})
