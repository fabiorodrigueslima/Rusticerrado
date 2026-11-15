import { createHash, randomBytes } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { createSecretBox } from '../src/security/secretBox.js'
import { createPaymentConnectionService } from '../src/services/paymentConnectionService.js'
import { createMercadoPagoProvider, paymentMethodRules } from '../src/providers/paymentProvider.js'

const KEY = randomBytes(32).toString('base64')
const config = {
  MERCADO_PAGO_CLIENT_ID: '1234567890',
  MERCADO_PAGO_CLIENT_SECRET: 'client-secret-only-for-tests',
  PAYMENT_TOKEN_KEY: KEY,
  MERCADO_PAGO_AUTH_URL: 'https://auth.mercadopago.com/authorization',
  MERCADO_PAGO_API_URL: 'https://api.mercadopago.com',
  PUBLIC_BACKEND_URL: 'https://www.rusticerrado.com.br',
  PUBLIC_FRONTEND_URL: 'https://www.rusticerrado.com.br',
  EXTERNAL_REQUEST_TIMEOUT_MS: 4000,
}
const NOW = Date.parse('2026-11-13T12:00:00Z')

// Minimal in-memory stand-in for the two tables the service uses.
function fakeDatabase() {
  const states = new Map()
  let connection = null
  const run = async ({ text, values }) => {
    if (text.startsWith('INSERT INTO app.oauth_estados')) { states.set(values[0], { admin_id: values[2], code_verifier_cifrado: values[3], used: false }); return { rowCount: 1, rows: [] } }
    if (text.startsWith('UPDATE app.oauth_estados')) { const row = states.get(values[0]); if (!row || row.used) return { rowCount: 0, rows: [] }; row.used = true; return { rowCount: 1, rows: [row] } }
    if (text.startsWith('INSERT INTO app.integracao_pagamento')) { connection = { conta_id: values[1], access_token_cifrado: values[2], refresh_token_cifrado: values[3], modo_producao: values[5], expira_em: values[6], conectado_em: new Date(NOW) }; return { rowCount: 1, rows: [] } }
    if (text.startsWith('SELECT') && text.includes('integracao_pagamento')) return { rowCount: connection ? 1 : 0, rows: connection ? [connection] : [] }
    if (text.startsWith('UPDATE app.integracao_pagamento')) { Object.assign(connection, { access_token_cifrado: values[1], refresh_token_cifrado: values[2], expira_em: values[3] }); return { rowCount: 1, rows: [] } }
    if (text.startsWith('DELETE FROM app.integracao_pagamento')) { const had = Boolean(connection); connection = null; return { rowCount: had ? 1 : 0, rows: [] } }
    throw new Error(`SQL inesperado: ${text.slice(0, 60)}`)
  }
  return { db: run, tx: async (work) => work({ query: run }), states, get connection() { return connection } }
}
const tokenResponse = (overrides = {}) => ({ ok: true, json: async () => ({ access_token: 'APP_USR-access', refresh_token: 'TG-refresh', user_id: 998877, public_key: 'APP_USR-public', live_mode: true, expires_in: 15552000, ...overrides }) })

describe('encrypted token storage', () => {
  it('round-trips and never stores the plain value', () => {
    const box = createSecretBox(KEY)
    const sealed = box.seal('APP_USR-segredo')
    expect(sealed).not.toContain('APP_USR')
    expect(box.open(sealed)).toBe('APP_USR-segredo')
    expect(box.seal('x')).not.toBe(box.seal('x'))
  })

  it('refuses tampered data or another key', () => {
    const sealed = createSecretBox(KEY).seal('valor')
    const [v, iv, tag, data] = sealed.split('.')
    expect(() => createSecretBox(KEY).open([v, iv, tag, data.slice(0, -2) + 'AA'].join('.'))).toThrow()
    expect(() => createSecretBox(randomBytes(32).toString('base64')).open(sealed)).toThrow()
    expect(() => createSecretBox('curta')).toThrow()
  })
})

describe('"Conectar Mercado Pago" (OAuth with PKCE)', () => {
  it('sends the owner to Mercado Pago with a single-use state and an S256 challenge', async () => {
    const fake = fakeDatabase()
    const service = createPaymentConnectionService({ db: fake.db, tx: fake.tx, config, now: () => NOW })
    const url = new URL((await service.startAuthorization(5)).authorizationUrl)
    expect(url.origin + url.pathname).toBe('https://auth.mercadopago.com/authorization')
    expect(Object.fromEntries(url.searchParams)).toMatchObject({ client_id: '1234567890', response_type: 'code', platform_id: 'mp', code_challenge_method: 'S256', redirect_uri: 'https://www.rusticerrado.com.br/api/v1/admin/payments/mercado-pago/callback' })
    const state = url.searchParams.get('state')
    const stored = fake.states.get(createHash('sha256').update(state).digest('hex'))
    expect(stored.admin_id).toBe(5)
    const verifier = createSecretBox(KEY).open(stored.code_verifier_cifrado)
    expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(verifier).digest('base64url'))
  })

  it('exchanges the code once, with the verifier, and keeps only encrypted tokens', async () => {
    const fake = fakeDatabase()
    const fetchImpl = vi.fn(async () => tokenResponse())
    const service = createPaymentConnectionService({ db: fake.db, tx: fake.tx, fetchImpl, config, now: () => NOW })
    const state = new URL((await service.startAuthorization(5)).authorizationUrl).searchParams.get('state')
    expect(await service.completeAuthorization({ code: 'TG-code', state })).toEqual({ adminId: 5, accountId: '998877' })
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.mercadopago.com/oauth/token')
    expect(body).toMatchObject({ grant_type: 'authorization_code', code: 'TG-code', client_id: '1234567890', test_token: 'false' })
    expect(body.code_verifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/)
    expect(JSON.stringify(fake.connection)).not.toContain('APP_USR-access')
    expect(await service.getAccessToken()).toBe('APP_USR-access')
    await expect(service.completeAuthorization({ code: 'TG-code', state })).rejects.toMatchObject({ code: 'PAYMENT_OAUTH_STATE_INVALID' })
    expect(await service.status()).toMatchObject({ appConfigured: true, connected: true, accountId: '998877', liveMode: true })
  })

  it('renews the token before it expires and stores the new refresh token', async () => {
    const fake = fakeDatabase()
    const fetchImpl = vi.fn(async () => tokenResponse({ expires_in: 10 * 86400 }))
    const service = createPaymentConnectionService({ db: fake.db, tx: fake.tx, fetchImpl, config, now: () => NOW })
    const state = new URL((await service.startAuthorization(5)).authorizationUrl).searchParams.get('state')
    await service.completeAuthorization({ code: 'TG-code', state })
    fetchImpl.mockImplementationOnce(async () => tokenResponse({ access_token: 'APP_USR-novo', refresh_token: 'TG-novo' }))
    expect(await service.getAccessToken()).toBe('APP_USR-novo')
    expect(JSON.parse(fetchImpl.mock.calls[1][1].body)).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'TG-refresh' })
    expect(createSecretBox(KEY).open(fake.connection.refresh_token_cifrado)).toBe('TG-novo')
  })

  it('reports not connected, and is unavailable while the developer app is not configured', async () => {
    const fake = fakeDatabase()
    expect(await createPaymentConnectionService({ db: fake.db, tx: fake.tx, config }).getAccessToken()).toBeNull()
    const bare = createPaymentConnectionService({ db: fake.db, tx: fake.tx, config: { ...config, PAYMENT_TOKEN_KEY: undefined } })
    expect(await bare.status()).toMatchObject({ appConfigured: false, connected: false })
    await expect(bare.startAuthorization(5)).rejects.toMatchObject({ code: 'PAYMENT_APP_NOT_CONFIGURED' })
  })
})

describe('payment methods chosen in the panel', () => {
  it('maps the switches to Checkout Pro exclusions and installments', () => {
    expect(paymentMethodRules({ pix: true, credit: true, debit: true, boleto: false, maxInstallments: 6 })).toEqual({ excluded: [{ id: 'atm' }, { id: 'ticket' }], installments: 6, boleto: false })
    expect(paymentMethodRules({ pix: true, credit: false, debit: false, boleto: true, maxInstallments: 3 }).excluded).toEqual([{ id: 'atm' }, { id: 'credit_card' }, { id: 'debit_card' }])
    expect(() => paymentMethodRules({ pix: false, credit: false, debit: false, boleto: false, maxInstallments: 1 })).toThrow()
  })

  it('uses the connected token and keeps a generated boleto payable for 3 days', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ id: 'pref-1', init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1' }) }))
    const provider = createMercadoPagoProvider({ fetchImpl, config: { ...config, NODE_ENV: 'production' }, now: () => NOW, tokenSource: async () => 'APP_USR-conectado', methodsSource: async () => ({ pix: true, credit: true, debit: false, boleto: true, maxInstallments: 4 }) })
    const deadline = new Date(NOW + 30 * 60000).toISOString()
    await provider.createPayment({ reference: 'BP-1', amount: '100.00', shipping: '0.00', items: [{ variantId: 1, productName: 'Brinco', quantity: 1, unitPrice: '100.00' }], method: 'PIX', idempotencyKey: 'k'.repeat(20), payer: { email: 'c@example.com' }, expiresAt: deadline })
    const [, request] = fetchImpl.mock.calls[0]
    const body = JSON.parse(request.body)
    expect(request.headers.Authorization).toBe('Bearer APP_USR-conectado')
    expect(body.expiration_date_to).toBe(deadline)
    expect(body.date_of_expiration).toBe(new Date(NOW + 3 * 86400000).toISOString())
    expect(body.payment_methods).toEqual({ excluded_payment_types: [{ id: 'atm' }, { id: 'debit_card' }], installments: 4 })
  })

  it('refuses to charge while no Mercado Pago account is connected', async () => {
    const provider = createMercadoPagoProvider({ fetchImpl: vi.fn(), config, now: () => NOW, tokenSource: async () => null })
    await expect(provider.createPayment({ reference: 'BP-1', amount: '10.00', items: [], idempotencyKey: 'k'.repeat(20), expiresAt: new Date(NOW + 600000).toISOString() })).rejects.toMatchObject({ code: 'PAYMENT_NOT_CONNECTED' })
  })
})
