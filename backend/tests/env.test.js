import { afterEach, describe, expect, it, vi } from 'vitest'

describe('environment configuration', () => {
  afterEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('parses the default DB_SSL value as a boolean false', async () => {
    const { env } = await import('../src/config/env.js')
    expect(env.DB_SSL).toBe(false)
  })

  it('rejects disabled payment provider in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/rusticerrado')
    vi.stubEnv('FRONTEND_ORIGINS', 'https://shop.example.com')
    vi.stubEnv('PAYMENT_PROVIDER', 'disabled')
    vi.stubEnv('SHIPPING_PROVIDER', 'superfrete')
    vi.stubEnv('SUPERFRETE_TOKEN', 'test-token')
    vi.stubEnv('SUPERFRETE_ORIGIN_CEP', '01001000')
    vi.stubEnv('SUPABASE_URL', 'https://abcdefgh.supabase.co')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test')
    vi.stubEnv('PUBLIC_BACKEND_URL', 'https://api.example.com')
    vi.stubEnv('PUBLIC_FRONTEND_URL', 'https://shop.example.com')

    await expect(import('../src/config/env.js')).rejects.toThrow(/PAYMENT_PROVIDER/)
  })

  it('rejects disabled shipping provider in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/rusticerrado')
    vi.stubEnv('FRONTEND_ORIGINS', 'https://shop.example.com')
    vi.stubEnv('PAYMENT_PROVIDER', 'mercado-pago')
    vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'TEST-token')
    vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', '1234567890abcdef')
    vi.stubEnv('SHIPPING_PROVIDER', 'disabled')
    vi.stubEnv('PUBLIC_BACKEND_URL', 'https://api.example.com')
    vi.stubEnv('PUBLIC_FRONTEND_URL', 'https://shop.example.com')

    await expect(import('../src/config/env.js')).rejects.toThrow(/SHIPPING_PROVIDER/)
  })

  function stubProductionStorage(storageProvider = 'supabase') {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/rusticerrado')
    vi.stubEnv('FRONTEND_ORIGINS', 'https://shop.example.com')
    vi.stubEnv('PAYMENT_PROVIDER', 'mercado-pago')
    vi.stubEnv('MERCADO_PAGO_ACCESS_TOKEN', 'test-token')
    vi.stubEnv('MERCADO_PAGO_WEBHOOK_SECRET', '1234567890abcdef')
    vi.stubEnv('SHIPPING_PROVIDER', 'superfrete')
    vi.stubEnv('SUPERFRETE_TOKEN', 'test-token')
    vi.stubEnv('SUPERFRETE_ORIGIN_CEP', '01001000')
    vi.stubEnv('PUBLIC_BACKEND_URL', 'https://api.example.com')
    vi.stubEnv('PUBLIC_FRONTEND_URL', 'https://shop.example.com')
    vi.stubEnv('STORAGE_PROVIDER', storageProvider)
    vi.stubEnv('SUPERFRETE_API_BASE_URL','https://api.superfrete.com/api/v0')
    vi.stubEnv('CRON_SECRET','test-cron-secret-12345678901234567890')
    vi.stubEnv('EMAIL_PROVIDER','http')
    vi.stubEnv('EMAIL_WEBHOOK_URL','https://mail.example.com/send')
    vi.stubEnv('EMAIL_WEBHOOK_TOKEN','test-only')
    vi.stubEnv('OPS_ALERT_EMAIL','loja@example.com')
    delete process.env.STORAGE_HTTP_URL
    delete process.env.STORAGE_HTTP_TOKEN
    delete process.env.STORAGE_PUBLIC_URL
    vi.stubEnv('SUPABASE_URL', 'https://abcdefgh.supabase.co')
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_test')
  }

  it.each([
    ['disabled', 'disabled'],
    ['local', 'local'],
  ])('rejects %s storage in production', async (_label, storageProvider) => {
    stubProductionStorage(storageProvider)

    await expect(import('../src/config/env.js')).rejects.toThrow(/STORAGE_PROVIDER/)
  })

  it('allows sandbox only in an explicitly isolated Vercel preview', async () => {
    stubProductionStorage()
    vi.stubEnv('SUPERFRETE_API_BASE_URL', 'https://sandbox.superfrete.com/api/v0')
    await expect(import('../src/config/env.js')).rejects.toThrow(/SUPERFRETE_API_BASE_URL/)
    vi.resetModules()
    vi.stubEnv('VERCEL_ENV', 'preview')
    const { env } = await import('../src/config/env.js')
    expect(env.SUPERFRETE_API_BASE_URL).toContain('sandbox')
  })

  it('accepts fixed-price shipping in production without any SuperFrete settings', async () => {
    stubProductionStorage()
    vi.stubEnv('SHIPPING_PROVIDER', 'configurable')
    vi.stubEnv('SHIPPING_FIXED_PRICE', '25.00')
    vi.stubEnv('SHIPPING_LOCAL_PICKUP', 'true')
    delete process.env.SUPERFRETE_TOKEN
    delete process.env.SUPERFRETE_ORIGIN_CEP
    delete process.env.SUPERFRETE_API_BASE_URL
    const { env } = await import('../src/config/env.js')
    expect(env).toMatchObject({ SHIPPING_PROVIDER: 'configurable', SHIPPING_FIXED_PRICE: '25.00', SHIPPING_LOCAL_PICKUP: true })
  })

  it('accepts Resend for emails in production and requires its key and sender', async () => {
    stubProductionStorage()
    vi.stubEnv('EMAIL_PROVIDER', 'resend')
    delete process.env.EMAIL_WEBHOOK_URL
    delete process.env.EMAIL_WEBHOOK_TOKEN
    vi.stubEnv('RESEND_API_KEY', 're_test_only')
    vi.stubEnv('EMAIL_FROM', 'RustiCerrado <pedidos@rusticerrado.com.br>')
    const { env } = await import('../src/config/env.js')
    expect(env.EMAIL_PROVIDER).toBe('resend')
    vi.resetModules()
    delete process.env.RESEND_API_KEY
    await expect(import('../src/config/env.js')).rejects.toThrow(/RESEND_API_KEY/)
  })

  it('rejects selling without any email service', async () => {
    stubProductionStorage()
    vi.stubEnv('EMAIL_PROVIDER', 'disabled')
    await expect(import('../src/config/env.js')).rejects.toThrow(/EMAIL_PROVIDER/)
  })

  it('rejects localhost in the production origin allowlist', async () => {
    stubProductionStorage()
    vi.stubEnv('FRONTEND_ORIGINS', 'https://localhost')
    await expect(import('../src/config/env.js')).rejects.toThrow(/FRONTEND_ORIGINS/)
  })

  it('rejects an invalid storage provider', async () => {
    stubProductionStorage('invalid')

    await expect(import('../src/config/env.js')).rejects.toThrow(/STORAGE_PROVIDER/)
  })

  it.each([
    ['project URL', 'SUPABASE_URL'],
    ['secret key', 'SUPABASE_SECRET_KEY'],
  ])('rejects Supabase storage without %s', async (_label, missingField) => {
    stubProductionStorage()
    delete process.env[missingField]

    await expect(import('../src/config/env.js')).rejects.toThrow(/SUPABASE_/)
  })

  it('accepts complete Supabase storage in production', async () => {
    stubProductionStorage()

    const { env } = await import('../src/config/env.js')

    expect(env.STORAGE_PROVIDER).toBe('supabase')
  })

  it('accepts local storage in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('STORAGE_PROVIDER', 'local')

    const { env } = await import('../src/config/env.js')

    expect(env.STORAGE_PROVIDER).toBe('local')
  })

  it('keeps disabled storage available in test', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('STORAGE_PROVIDER', 'disabled')

    const { env } = await import('../src/config/env.js')

    expect(env.STORAGE_PROVIDER).toBe('disabled')
  })
})
