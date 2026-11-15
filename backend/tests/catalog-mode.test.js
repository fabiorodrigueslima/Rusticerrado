import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

function catalogProduction() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('SITE_MODE', 'catalog');
  vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
  vi.stubEnv('PUBLIC_FRONTEND_URL', 'https://shop.example.com');
  vi.stubEnv('PUBLIC_BACKEND_URL', 'https://shop.example.com');
  vi.stubEnv('FRONTEND_ORIGINS', 'https://shop.example.com');
}

// Each case re-imports the whole app from scratch, which is slow under a parallel suite.
const COLD_IMPORT_TIMEOUT_MS = 30_000;

describe('catalog-only publication', () => {
  it('boots production without commerce credentials and disables provider transports', async () => {
    catalogProduction();
    vi.stubEnv('PAYMENT_PROVIDER', 'mercado-pago');
    const { env } = await import('../src/config/env.js');
    for (const field of ['PAYMENT_PROVIDER', 'SHIPPING_PROVIDER', 'EMAIL_PROVIDER', 'STORAGE_PROVIDER']) expect(env[field]).toBe('disabled');
  }, COLD_IMPORT_TIMEOUT_MS);

  it('keeps e-mail on in catalog mode so the panel can recover passwords', async () => {
    catalogProduction();
    vi.stubEnv('EMAIL_PROVIDER', 'resend');
    vi.stubEnv('RESEND_API_KEY', 're_test_only');
    vi.stubEnv('EMAIL_FROM', 'RustiCerrado <nao-responda@rusticerrado.com.br>');
    const { env } = await import('../src/config/env.js');
    expect(env.EMAIL_PROVIDER).toBe('resend');
    expect(env.PAYMENT_PROVIDER).toBe('disabled');
  }, COLD_IMPORT_TIMEOUT_MS);

  it('keeps Cloudinary photo storage in catalog mode, but never local or HTTP storage', async () => {
    catalogProduction();
    vi.stubEnv('STORAGE_PROVIDER', 'cloudinary');
    vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'demo');
    vi.stubEnv('CLOUDINARY_API_KEY', 'key');
    vi.stubEnv('CLOUDINARY_API_SECRET', 'secret');
    expect((await import('../src/config/env.js')).env.STORAGE_PROVIDER).toBe('cloudinary');
    vi.resetModules();
    vi.stubEnv('STORAGE_PROVIDER', 'local');
    expect((await import('../src/config/env.js')).env.STORAGE_PROVIDER).toBe('disabled');
  }, COLD_IMPORT_TIMEOUT_MS);

  it('still requires the Cloudinary credentials when catalog mode uses Cloudinary', async () => {
    catalogProduction();
    vi.stubEnv('STORAGE_PROVIDER', 'cloudinary');
    await expect(import('../src/config/env.js')).rejects.toThrow(/CLOUDINARY_CLOUD_NAME/);
  }, COLD_IMPORT_TIMEOUT_MS);

  it('keeps HTTPS and database requirements in catalog production', async () => {
    catalogProduction();
    vi.stubEnv('FRONTEND_ORIGINS', 'http://localhost:5173');
    await expect(import('../src/config/env.js')).rejects.toThrow(/FRONTEND_ORIGINS/);
    vi.resetModules();
    vi.stubEnv('FRONTEND_ORIGINS', 'https://shop.example.com');
    vi.stubEnv('DATABASE_URL', '');
    await expect(import('../src/config/env.js')).rejects.toThrow(/DATABASE_URL/);
  }, COLD_IMPORT_TIMEOUT_MS);

  it('rejects direct commerce, account, webhook and job requests before database access', async () => {
    vi.stubEnv('SITE_MODE', 'catalog');
    const { app } = await import('../src/app.js');
    for (const route of ['/api/v1/orders', '/api/v1/orders/ABC/payments', '/api/v1/checkout/quote', '/api/v1/customers/auth/register', '/api/v1/webhooks/payments/mercado-pago', '/api/internal/jobs/send-emails']) {
      const response = await request(app).post(route).send({});
      expect(response.status).toBe(503);
      expect(response.body.error.code).toBe('CATALOG_ONLY');
    }
    expect((await request(app).get('/api/v1/storefront')).body.data.mode).toBe('catalog');
    expect((await request(app).get('/api/v1/admin/auth/me')).status).toBe(401);
  }, COLD_IMPORT_TIMEOUT_MS);
});

describe('partly configured Mercado Pago connection', () => {
  it('never stops the site when only the encryption key is set', async () => {
    catalogProduction();
    vi.stubEnv('PAYMENT_TOKEN_KEY', Buffer.alloc(32, 7).toString('base64'));
    const { env } = await import('../src/config/env.js');
    expect(env.PAYMENT_TOKEN_KEY).toBeTruthy();
    expect(env.MERCADO_PAGO_CLIENT_ID).toBeUndefined();
  }, COLD_IMPORT_TIMEOUT_MS);
});
