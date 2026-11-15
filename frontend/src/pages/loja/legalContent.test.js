import { describe, expect, it } from 'vitest'
import { legalContent } from './legalContent.js'

const allText = (pages) => JSON.stringify(pages)

describe('legal pages follow how the store sells', () => {
  it('describes ordering by message while the site is a catalog', () => {
    const text = allText(legalContent(false))
    expect(text).toContain('O site é um catálogo')
    expect(text).not.toContain('coloque no carrinho')
  })

  it('describes checkout, payment, tracking and every data processor once sales are on', () => {
    const pages = legalContent(true)
    const text = allText(pages)
    expect(text).not.toContain('O site é um catálogo')
    expect(text).toContain('coloque no carrinho')
    expect(text).toContain('código de rastreio')
    for (const processor of ['Mercado Pago', 'Netlify', 'Neon', 'Cloudinary']) expect(text).toContain(processor)
    expect(Object.keys(pages)).toEqual(['privacy', 'terms', 'returns'])
  })
})
