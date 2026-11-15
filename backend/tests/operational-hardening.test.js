import { describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../src/middlewares/errorHandler.js'
import { requireCsrf } from '../src/middlewares/adminSecurity.js'
import { PostgresRateLimitStore } from '../src/security/postgresRateLimitStore.js'
import { purgeExpiredCredentials, RETENTION_QUERIES } from '../src/services/jobService.js'

const response = () => { const res = { status: vi.fn(() => res), json: vi.fn(() => res) }; return res }

describe('database constraint errors', () => {
  it('turns duplicate and missing-reference violations into 409 without leaking SQL state', () => {
    for (const [code, expected] of [['23505', 'DUPLICATE_VALUE'], ['23503', 'RELATED_RECORD_INVALID']]) {
      const res = response()
      errorHandler(Object.assign(new Error('duplicate key value violates unique constraint "produtos_slug_key"'), { code }), { requestId: 'r1' }, res)
      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json.mock.calls[0][0].error).toMatchObject({ code: expected })
      expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('produtos_slug_key')
    }
  })
  it('keeps other database failures as a generic 500 without the SQL state code', () => {
    const res = response()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    errorHandler(Object.assign(new Error('relation does not exist'), { code: '42P01' }), { requestId: 'r1' }, res)
    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json.mock.calls[0][0].error.code).toBe('INTERNAL_ERROR')
    log.mockRestore()
  })
})

describe('administrative origin check', () => {
  it('rejects "null" and malformed Origin headers with 403 instead of crashing', () => {
    for (const origin of ['null', 'not a url', 'http://[::1']) {
      const next = vi.fn()
      requireCsrf({ get: (name) => (name === 'origin' ? origin : ''), app: { get: () => ['http://localhost:5173'] }, admin: { csrf_secret_hash: 'x' } }, {}, next)
      expect(next.mock.calls[0][0]).toMatchObject({ status: 403, code: 'CSRF_INVALID' })
    }
  })
})

describe('rate limit table growth', () => {
  const row = { rows: [{ hits: 1, expires_at: new Date().toISOString() }] }
  it('sweeps a bounded batch of expired rows on a small sample of requests', async () => {
    const db = vi.fn(async () => row)
    await new PostgresRateLimitStore('t', db, () => 0.5).increment('ip')
    expect(db).toHaveBeenCalledTimes(1)
    await new PostgresRateLimitStore('t', db, () => 0.001).increment('ip')
    expect(db).toHaveBeenCalledTimes(3)
    expect(db.mock.calls[1][0]).toMatch(/DELETE FROM app\.rate_limits .*LIMIT 500/)
  })
  it('never fails the request when the sweep fails', async () => {
    const db = vi.fn(async (sql) => { if (sql.startsWith('DELETE')) throw new Error('lock timeout'); return row })
    await expect(new PostgresRateLimitStore('t', db, () => 0).increment('ip')).resolves.toMatchObject({ totalHits: 1 })
  })
})

describe('credential retention', () => {
  it('purges expired sessions, tokens and idempotency keys after a grace period only', async () => {
    const db = vi.fn(async () => ({ rowCount: 2 }))
    await expect(purgeExpiredCredentials(db)).resolves.toEqual({ adminSessions: 2, customerSessions: 2, resetTokens: 2, activationTokens: 2, idempotencyKeys: 2, loginThrottle: 2 })
    for (const sql of Object.values(RETENTION_QUERIES)) expect(sql).toMatch(/now\(\)-interval '(7|30) days'/)
    expect(Object.values(RETENTION_QUERIES).join(' ')).not.toMatch(/audit_logs|pedidos|webhook_eventos|pagamentos/)
  })
})
