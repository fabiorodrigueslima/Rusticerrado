// Exemplos da página Personalizados.
// A dona da loja controla pelo painel: as peças da categoria "Personalizados"
// (com foto) aparecem aqui sozinhas. Sem nenhuma, a página mostra os exemplos fixos.

export const CATEGORIA_PERSONALIZADOS = 'personalizados'
export const LIMITE_EXEMPLOS = 6

// Corta textos longos para o cartão não ficar enorme.
export function resumo(texto, limite = 90) {
  const limpo = String(texto ?? '').replace(/\s+/g, ' ').trim()
  if (limpo.length <= limite) return limpo
  return `${limpo.slice(0, limite).replace(/\s+\S*$/, '')}…`
}

// Transforma as peças do catálogo em cartões de exemplo.
// Peça sem foto própria (que mostraria só a logo) fica de fora.
export function exemplosDosProdutos(produtos, imagemPadrao) {
  return produtos
    .filter((produto) => produto.imagem && produto.imagem !== imagemPadrao)
    .slice(0, LIMITE_EXEMPLOS)
    .map((produto) => ({
      chave: produto.slug,
      imagem: produto.imagem,
      alt: produto.imagemAlt || produto.nome,
      titulo: produto.nome,
      texto: resumo(produto.descricao),
      link: `/produto/${produto.slug}`,
    }))
}
