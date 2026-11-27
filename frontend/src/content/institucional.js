// Textos das páginas "Nossa História" (/sobre) e "Como é feito" (/como-e-feito).
//
// COMO USAR:
// 1. Preencha os textos com o que a cliente contou. Não invente: só o que for verdade.
// 2. Troque `pronto: false` por `pronto: true`.
// 3. Pronto: a página passa a abrir e o link aparece no menu e no rodapé.
//
// Enquanto `pronto` for false, a página não abre (mostra "Página não encontrada")
// e os links ficam escondidos. Assim nada pela metade vai para o ar.
//
// FOTOS: coloque o arquivo em frontend/public/fotos/ e escreva o caminho, por exemplo
// foto: '/fotos/oficina.jpg'. Sem foto, a página mostra a logo da loja.

export const historia = {
  pronto: false,

  // Frase grande do topo. Ex.: 'Madeira do Cerrado, feita à mão em São Sebastião.'
  chamada: '',
  // Frase menor embaixo da chamada.
  subtitulo: '',

  // Um texto por parágrafo: quem faz, como começou, por que "Cerrado", de onde vem a madeira.
  paragrafos: [
    // 'A RustiCerrado começou em ...',
  ],

  foto: '',
  fotoAlt: '',

  // O que a marca valoriza (até 3). Ex.: { titulo: 'Madeira reaproveitada', texto: '...' }
  valores: [],
}

export const processo = {
  pronto: false,

  chamada: '',
  subtitulo: '',

  // Os passos, na ordem. Ex.: { titulo: 'Escolha da madeira', texto: '...' }
  etapas: [],

  // Ex.: 'Peças sob encomenda ficam prontas em cerca de 15 dias.'
  prazo: '',

  foto: '',
  fotoAlt: '',
}

// Uma página só vai para o ar quando está marcada como pronta e tem o texto principal.
export function paginaPronta(pagina) {
  if (!pagina?.pronto || !pagina.chamada?.trim()) return false
  if ('etapas' in pagina) return (pagina.etapas?.length ?? 0) > 0
  return (pagina.paragrafos?.length ?? 0) > 0
}
