import { describe, expect, it } from 'vitest'
import { handler, prepareRequest, toAppPath } from '../../netlify/functions/api.mjs'
import sharePreview, { config as previewConfig } from '../../netlify/edge-functions/share-preview.js'

const event = (path, extra = {}) => ({
  httpMethod: 'GET',
  path,
  headers: { host: 'www.brincosdeprincesa.com.br', 'x-nf-client-connection-ip': '200.1.2.3', ...(extra.headers ?? {}) },
  multiValueHeaders: {},
  queryStringParameters: extra.query ?? null,
  multiValueQueryStringParameters: null,
  body: extra.body ?? null,
  isBase64Encoded: false,
  requestContext: {},
})

describe('Netlify function adapter', () => {
  it('maps both the original and the rewritten path to the Express route', () => {
    expect(toAppPath('/.netlify/functions/api/api/v1/health')).toBe('/api/v1/health')
    expect(toAppPath('/api/v1/health')).toBe('/api/v1/health')
    expect(toAppPath('/.netlify/functions/api/sitemap.xml')).toBe('/sitemap.xml')
    expect(toAppPath('/.netlify/functions/api/produto/brinco-folha')).toBe('/produto/brinco-folha')
    expect(toAppPath('/.netlify/functions/api')).toBe('/')
    expect(toAppPath('/.netlify/functions/apis/x')).toBe('/.netlify/functions/apis/x')
  })

  it("uses Netlify's client IP and drops a forged X-Forwarded-For", () => {
    const req = { url: '/api/v1/health', headers: { 'x-forwarded-for': '6.6.6.6' } }
    prepareRequest(req, { headers: { 'x-nf-client-connection-ip': '200.1.2.3' } })
    expect(req.headers['x-forwarded-for']).toBe('200.1.2.3')
    expect(req.ip).toBe('200.1.2.3')
    const forged = { url: '/api/v1/health', headers: { 'x-forwarded-for': '6.6.6.6' } }
    prepareRequest(forged, { headers: {} })
    expect(forged.headers['x-forwarded-for']).toBe('0.0.0.0')
  })

  it('answers through the Lambda-style handler on the rewritten path', async () => {
    const response = await handler(event('/.netlify/functions/api/api/v1/health'), {})
    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' })
    expect(response.headers['x-content-type-options'] ?? response.multiValueHeaders?.['x-content-type-options']).toBeTruthy()
    const storefront = await handler(event('/api/v1/storefront'), {})
    expect(JSON.parse(storefront.body).data.mode).toMatch(/^(catalog|commerce)$/)
    expect((await handler(event('/.netlify/functions/api/api/v1/nao-existe'), {})).statusCode).toBe(404)
    // JSON bodies reach Express validation (plain and base64-encoded, as Netlify may send either).
    const login = (body, isBase64Encoded) => handler({ ...event('/.netlify/functions/api/api/v1/admin/auth/login', { headers: { 'content-type': 'application/json' }, body }), httpMethod: 'POST', isBase64Encoded }, {})
    const plain = await login(JSON.stringify({ email: 'x' }), false)
    expect(plain.statusCode).toBe(400)
    const encoded = await login(Buffer.from(JSON.stringify({ email: 'x' })).toString('base64'), true)
    expect(encoded.statusCode).toBe(400)
    expect(JSON.parse(encoded.body).error.code).toBe(JSON.parse(plain.body).error.code)
  })
})

describe('link-preview edge function', () => {
  const at = (userAgent) => new Request('https://www.brincosdeprincesa.com.br/produto/brinco-folha', { headers: { 'user-agent': userAgent } })

  it('sends only preview robots to the API and lets everyone else see the site', () => {
    expect(previewConfig.path).toBe('/produto/*')
    expect(String(sharePreview(at('WhatsApp/2.23.20.0')))).toBe('https://www.brincosdeprincesa.com.br/.netlify/functions/api/produto/brinco-folha')
    expect(String(sharePreview(at('facebookexternalhit/1.1')))).toContain('/.netlify/functions/api/produto/')
    expect(sharePreview(at('Mozilla/5.0 (iPhone) Safari/604.1'))).toBeUndefined()
    expect(sharePreview(at('Googlebot/2.1'))).toBeUndefined()
  })
})
