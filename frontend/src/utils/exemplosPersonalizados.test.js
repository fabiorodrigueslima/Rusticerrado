import { describe, expect, it } from 'vitest'
import { exemplosDosProdutos, resumo } from './exemplosPersonalizados.js'

const LOGO = '/logo.png'
const peca = (slug, extra = {}) => ({
  slug,
  nome: `Peça ${slug}`,
  descricao: 'Feita sob encomenda.',
  imagem: `/fotos/${slug}.jpg`,
  imagemAlt: `Foto ${slug}`,
  ...extra,
})

describe('exemplos da página Personalizados', () => {
  it('usa as peças do painel com link para a página da peça', () => {
    expect(exemplosDosProdutos([peca('tabua-nome')], LOGO)).toEqual([
      {
        chave: 'tabua-nome',
        imagem: '/fotos/tabua-nome.jpg',
        alt: 'Foto tabua-nome',
        titulo: 'Peça tabua-nome',
        texto: 'Feita sob encomenda.',
        link: '/produto/tabua-nome',
      },
    ])
  })

  it('deixa de fora peça sem foto e mostra no máximo 6', () => {
    const lista = [peca('sem-foto', { imagem: LOGO }), ...Array.from({ length: 8 }, (_, i) => peca(`p${i}`))]
    const exemplos = exemplosDosProdutos(lista, LOGO)
    expect(exemplos).toHaveLength(6)
    expect(exemplos.map((e) => e.chave)).not.toContain('sem-foto')
  })

  it('corta descrição longa sem quebrar palavra', () => {
    const texto = resumo('Tábua de churrasco feita com madeira de peroba rosa e acabamento natural com óleo mineral próprio para alimentos', 40)
    expect(texto).toBe('Tábua de churrasco feita com madeira de…')
  })
})
