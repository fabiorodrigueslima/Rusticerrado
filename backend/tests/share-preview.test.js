import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { createSharePreviewService, previewImage, sharePreviewService, shortDescription } from '../src/services/sharePreviewService.js'
import { AppError } from '../src/utils/AppError.js'

const origin = 'https://www.rusticerrado.com.br'
const product = (overrides = {}) => ({
  name: 'Brinco Folha <Dourada>',
  description: 'Feito à mão com folha do Cerrado.',
  seo: { title: null, description: null },
  images: [
    { url: 'https://abcdefgh.supabase.co/storage/v1/object/public/rusticerrado/produtos/folha-2.jpg', primary: false },
    { url: 'https://abcdefgh.supabase.co/storage/v1/object/public/rusticerrado/produtos/folha-1.jpg', primary: true },
  ],
  ...overrides,
})
const service = (result) => createSharePreviewService({ getProduct: vi.fn(async () => { if (result instanceof Error) throw result; return result }) })

describe('link preview of a product', () => {
  it('shows the product name, text and main photo', async () => {
    const { status, html } = await service(product()).product('brinco-folha', `${origin}/`)
    expect(status).toBe(200)
    expect(html).toContain('<meta property="og:title" content="Brinco Folha &lt;Dourada&gt; | RustiCerrado">')
    expect(html).toContain('<meta property="og:description" content="Feito à mão com folha do Cerrado.">')
    expect(html).toContain('<meta property="og:image" content="https://abcdefgh.supabase.co/storage/v1/object/public/rusticerrado/produtos/folha-1.jpg">')
    expect(html).toContain(`<meta property="og:url" content="${origin}/produto/brinco-folha">`)
    expect(html).toContain('<meta property="og:type" content="product">')
    expect(html).not.toContain('<Dourada>')
  })

  it('prefers the SEO title and description written in the panel', async () => {
    const { html } = await service(product({ seo: { title: 'Brinco Folha', description: 'Resumo da peça.' } })).product('brinco-folha', origin)
    expect(html).toContain('<meta property="og:title" content="Brinco Folha">')
    expect(html).toContain('<meta property="og:description" content="Resumo da peça.">')
  })

  it('shows the site card when the product is not published', async () => {
    const { status, html } = await service(new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto não encontrado.')).product('rascunho', origin)
    expect(status).toBe(404)
    expect(html).toContain('<meta property="og:title" content="RustiCerrado">')
    expect(html).toContain(`content="${origin}/brand/rusticerrado-logo.png"`)
  })

  it('does not hide other failures', async () => {
    await expect(service(new Error('db down')).product('brinco-folha', origin)).rejects.toThrow('db down')
  })

  it('cuts long text between words', () => {
    const text = 'palavra '.repeat(60)
    const short = shortDescription(text)
    expect(short.length).toBeLessThanOrEqual(201)
    expect(short.endsWith('palavra…')).toBe(true)
  })

  it('makes site photos absolute and uses the logo when there is no photo', () => {
    expect(previewImage('/images/brinco.png', origin)).toBe(`${origin}/images/brinco.png`)
    expect(previewImage(undefined, origin)).toBe(`${origin}/brand/rusticerrado-logo.png`)
    expect(previewImage('https://res.cloudinary.com/loja/image/upload/v1/rusticerrado/produtos/a.jpg', origin)).toBe('https://res.cloudinary.com/loja/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/v1/rusticerrado/produtos/a.jpg')
  })

  it('answers preview robots at /produto/:slug with HTML', async () => {
    const spy = vi.spyOn(sharePreviewService, 'product').mockResolvedValue({ status: 200, html: '<!doctype html><title>ok</title>' })
    const response = await request(app).get('/produto/brinco-folha').set('User-Agent', 'WhatsApp/2.24')
    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.headers['cache-control']).toBe('public, max-age=600')
    expect(spy).toHaveBeenCalledWith('brinco-folha', expect.any(String))
    await request(app).get('/produto/..%2Fadmin')
    expect(spy).toHaveBeenLastCalledWith('', expect.any(String))
    spy.mockRestore()
  })
})
