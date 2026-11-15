import { describe, expect, it, vi } from 'vitest'
import { STATIC_PATHS, createSitemapService } from '../src/services/sitemapService.js'

const fakeDb = (rows) => vi.fn(async (text) => ({
  rows: text.includes('app.produtos') ? rows.products : rows.collections,
}))

describe('sitemap', () => {
  it('lists public pages, published products, and active collections', async () => {
    const db = fakeDb({
      products: [{ slug: 'tabua-de-churrasco', atualizado_em: new Date('2026-11-02T15:00:00Z') }],
      collections: [{ slug: 'cerrado', atualizado_em: '2026-10-01T00:00:00Z' }],
    })
    const xml = await createSitemapService(db).build('https://www.rusticerrado.com.br/')
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(xml).toContain('<loc>https://www.rusticerrado.com.br/</loc>')
    expect(xml).toContain('<loc>https://www.rusticerrado.com.br/loja</loc>')
    expect(xml).toContain('<url><loc>https://www.rusticerrado.com.br/produto/tabua-de-churrasco</loc><lastmod>2026-11-02</lastmod></url>')
    expect(xml).toContain('<loc>https://www.rusticerrado.com.br/colecoes/cerrado</loc><lastmod>2026-10-01</lastmod>')
    expect(xml.match(/<url>/g)).toHaveLength(STATIC_PATHS.length + 2)
  })

  it('only asks the database for what visitors can open', async () => {
    const db = fakeDb({ products: [], collections: [] })
    await createSitemapService(db).build('https://loja.example.com')
    const queries = db.mock.calls.map(([text]) => text)
    expect(queries.find((text) => text.includes('app.produtos'))).toContain("status='ACTIVE'")
    expect(queries.find((text) => text.includes('app.colecoes'))).toContain('WHERE ativa')
    expect(queries.some((text) => text.includes('app.cursos'))).toBe(false)
  })

  it('never lists private pages', () => {
    for (const path of ['/admin', '/checkout', '/carrinho', '/minha-conta', '/login', '/pedido']) expect(STATIC_PATHS).not.toContain(path)
  })
})
