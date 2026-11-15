import { describe, expect, it } from 'vitest'
import { IMAGEM_PADRAO, cartaoDoProduto, detalheDoProduto, itemDoCarrinho } from './catalogo.js'

const doServidor = {
  id: 7,
  name: 'Tábua de Churrasco',
  slug: 'tabua-de-churrasco',
  description: 'Madeira e resina.',
  materials: 'Peroba-rosa e resina',
  dimensions: '40 x 25 cm',
  care: null,
  productionDays: 5,
  category: { name: 'Tábuas', slug: 'tabuas' },
  variants: [
    { id: 11, name: 'Grande', sku: 'TAB-G', price: '180.00', salePrice: '150.00', availableStock: 2 },
    { id: 12, name: 'Pequena', sku: 'TAB-P', price: '120.00', salePrice: null, availableStock: 0 },
  ],
  images: [{ url: 'https://abc.supabase.co/storage/v1/object/public/rusticerrado/produtos/a.jpg', alt: 'Tábua grande' }],
}

describe('catálogo da loja', () => {
  it('converte um cartão da lista para o formato das páginas', () => {
    expect(cartaoDoProduto({
      id: 7, name: 'Tábua', slug: 'tabua', description: null, price: '150.00', originalPrice: '180.00',
      inStock: true, featured: true, isNew: false, category: { name: 'Tábuas' }, image: null,
    })).toEqual({
      id: 'tabua', slug: 'tabua', nome: 'Tábua', descricao: '', preco: 150, precoOriginal: 180,
      imagem: IMAGEM_PADRAO, imagemAlt: 'Tábua', emEstoque: true, categoria: 'Tábuas', destaque: true, novidade: false,
    })
  })

  it('usa o preço promocional e guarda o preço cheio para riscar', () => {
    const produto = detalheDoProduto(doServidor)
    expect(produto.variantes[0]).toMatchObject({ id: 11, preco: 150, precoOriginal: 180, disponivel: 2 })
    expect(produto.variantes[1]).toMatchObject({ id: 12, preco: 120, precoOriginal: null, disponivel: 0 })
    expect(produto.categoria).toBe('Tábuas')
  })

  it('mostra a logo quando a peça ainda não tem foto', () => {
    expect(detalheDoProduto({ ...doServidor, images: [] }).imagens).toEqual([{ url: IMAGEM_PADRAO, alt: 'Tábua de Churrasco' }])
  })

  it('guarda no carrinho a variação escolhida, separada das outras', () => {
    const produto = detalheDoProduto(doServidor)
    expect(itemDoCarrinho(produto, produto.variantes[0], 2)).toEqual({
      id: 'v11', varianteId: 11, slug: 'tabua-de-churrasco', nome: 'Tábua de Churrasco — Grande',
      preco: 150, imagem: doServidor.images[0].url, estoque: 2, quantidade: 2,
    })
  })
})
