import { describe, expect, it, vi } from 'vitest'
import { createTurnstile } from '../src/security/turnstile.js'

const keys = { TURNSTILE_SITE_KEY: '0x4AAAAAAA-site', TURNSTILE_SECRET_KEY: '0x4AAAAAAA-secret', EXTERNAL_REQUEST_TIMEOUT_MS: 1000 }
const request = (token) => ({ ip: '203.0.113.9', get: (name) => (name === 'x-turnstile-token' ? token : undefined) })
const run = async (middleware, req) => { const next = vi.fn(); await middleware(req, {}, next); return next.mock.calls[0][0] }
const answer = (payload, ok = true) => vi.fn(async () => ({ ok, json: async () => payload }))

describe('Cloudflare Turnstile anti-robot check', () => {
  it('stays off and lets requests through until both keys exist', async () => {
    for (const config of [{}, { TURNSTILE_SITE_KEY: 'site' }, { TURNSTILE_SECRET_KEY: 'secret' }, { TURNSTILE_SITE_KEY: ' ', TURNSTILE_SECRET_KEY: ' ' }]) {
      const fetchImpl = vi.fn()
      const check = createTurnstile(config, fetchImpl)
      expect(check.enabled).toBe(false)
      expect(check.siteKey).toBeNull()
      expect(await run(check.requireHuman('register'), request(undefined))).toBeUndefined()
      expect(fetchImpl).not.toHaveBeenCalled()
    }
  })

  it('publishes only the site key, never the secret', () => {
    const check = createTurnstile(keys, vi.fn())
    expect(check.siteKey).toBe(keys.TURNSTILE_SITE_KEY)
    expect(JSON.stringify(check)).not.toContain(keys.TURNSTILE_SECRET_KEY)
  })

  it('requires a token when enabled', async () => {
    const fetchImpl = vi.fn()
    const check = createTurnstile(keys, fetchImpl)
    expect(await run(check.requireHuman('register'), request(undefined))).toMatchObject({ status: 400, code: 'BOT_CHECK_REQUIRED' })
    expect(await run(check.requireHuman('register'), request('x'.repeat(2049)))).toMatchObject({ code: 'BOT_CHECK_REQUIRED' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('asks Cloudflare with the secret, the token and the visitor address', async () => {
    const fetchImpl = answer({ success: true, action: 'register' })
    const check = createTurnstile(keys, fetchImpl)
    expect(await run(check.requireHuman('register'), request('token-1'))).toBeUndefined()
    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(Object.fromEntries(options.body)).toEqual({ secret: keys.TURNSTILE_SECRET_KEY, response: 'token-1', remoteip: '203.0.113.9' })
  })

  it('refuses failed, expired or reused tokens and tokens from another form', async () => {
    for (const payload of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, action: 'forgot' }]) {
      const check = createTurnstile(keys, answer(payload))
      expect(await run(check.requireHuman('register'), request('token'))).toMatchObject({ status: 400, code: 'BOT_CHECK_FAILED' })
    }
  })

  it('fails closed when Cloudflare cannot be reached', async () => {
    for (const fetchImpl of [vi.fn(async () => { throw new Error('network') }), answer(null, false)]) {
      const check = createTurnstile(keys, fetchImpl)
      expect(await run(check.requireHuman('register'), request('token'))).toMatchObject({ status: 503, code: 'BOT_CHECK_UNAVAILABLE' })
    }
  })
})
