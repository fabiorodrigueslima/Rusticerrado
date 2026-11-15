/**
 * Catálogo da loja: busca os produtos no servidor (cadastrados pela dona no painel) e
 * entrega no formato que as páginas do site já usam (nome, preco, imagem…).
 */
import { getProduct, getProducts } from './lojaApi.js'
import logo from '../assets/img/RustiCerrado.oficial.png'

// Peça ainda sem foto: mostra a logo da loja.
export const IMAGEM_PADRAO = logo

const numero = (valor) => (valor == null ? null : Number(valor))

export function formatarPreco(valor) {
  return Number(valor ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Um cartão da lista (Loja, Home). O id é o "endereço" da peça (slug), usado no link.
export function cartaoDoProduto(item) {
  return {
    id: item.slug,
    slug: item.slug,
    nome: item.name,
    descricao: item.description ?? '',
    preco: numero(item.price) ?? 0,
    precoOriginal: numero(item.originalPrice),
    imagem: item.image?.url ?? IMAGEM_PADRAO,
    imagemAlt: item.image?.alt ?? item.name,
    emEstoque: Boolean(item.inStock),
    categoria: item.category?.name ?? null,
    destaque: Boolean(item.featured),
    novidade: Boolean(item.isNew),
  }
}

export function detalheDoProduto(data) {
  const variantes = data.variants.map((variante) => ({
    id: variante.id,
    nome: variante.name,
    sku: variante.sku,
    preco: numero(variante.salePrice) ?? numero(variante.price),
    precoOriginal: variante.salePrice ? numero(variante.price) : null,
    disponivel: Math.max(0, Number(variante.availableStock ?? 0)),
  }))
  const imagens = data.images.length
    ? data.images.map((imagem) => ({ url: imagem.url, alt: imagem.alt || data.name }))
    : [{ url: IMAGEM_PADRAO, alt: data.name }]
  return {
    id: data.slug,
    slug: data.slug,
    nome: data.name,
    descricao: data.description ?? '',
    materiais: data.materials ?? null,
    medidas: data.dimensions ?? null,
    cuidados: data.care ?? null,
    prazoProducaoDias: Number(data.productionDays ?? 0),
    categoria: data.category?.name ?? null,
    imagens,
    variantes,
  }
}

export async function listarProdutos({ busca, categoria, ordem = 'name', limite = 48 } = {}, signal) {
  const { data } = await getProducts({ q: busca?.trim() || undefined, category: categoria, sort: ordem, limit: limite }, signal)
  return data.map(cartaoDoProduto)
}

export async function obterProduto(slug, signal) {
  const { data } = await getProduct(slug, signal)
  return detalheDoProduto(data)
}

// Item do carrinho: uma variação de uma peça. A chave é a variação, então "Tábua grande"
// e "Tábua pequena" nunca se misturam. O checkout envia varianteId ao servidor.
export function itemDoCarrinho(produto, variante, quantidade = 1) {
  return {
    id: `v${variante.id}`,
    varianteId: variante.id,
    slug: produto.slug,
    nome: produto.variantes.length > 1 ? `${produto.nome} — ${variante.nome}` : produto.nome,
    preco: variante.preco,
    imagem: produto.imagens[0]?.url ?? IMAGEM_PADRAO,
    estoque: variante.disponivel,
    quantidade,
  }
}

// Para os botões "Adicionar" da lista: usa a primeira variação disponível da peça.
export async function itemParaCarrinho(slug, signal) {
  const produto = await obterProduto(slug, signal)
  const variante = produto.variantes.find((item) => item.disponivel > 0)
  if (!variante) throw new Error('Esta peça está esgotada no momento.')
  return itemDoCarrinho(produto, variante)
}
