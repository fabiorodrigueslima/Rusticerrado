// Monta as mensagens que os formulários do site mandam para o WhatsApp da loja.
// O cliente preenche o formulário, o site abre o WhatsApp com o texto pronto
// e ele só precisa tocar em "Enviar". Assim nenhum pedido se perde.

export const ASSUNTOS_CONTATO = {
  produto: 'Dúvida sobre produto',
  pedido: 'Dúvida sobre pedido',
  personalizado: 'Produto personalizado',
  orcamento: 'Orçamento',
  outro: 'Outro',
}

export const TIPOS_PERSONALIZADO = {
  tabua: 'Tábua (churrasco, corte ou servir)',
  petisqueira: 'Petisqueira',
  porta_facas: 'Porta-facas',
  abridor: 'Abridor de garrafa',
  chaveiro: 'Chaveiro',
  porta_joias: 'Porta-joias / decoração',
  outro: 'Outro',
}

// Junta as linhas e pula os campos que o cliente deixou em branco.
function juntar(linhas) {
  return linhas
    .filter(([, valor]) => valor !== undefined && String(valor).trim() !== '')
    .map(([rotulo, valor]) => (rotulo ? `*${rotulo}:* ${String(valor).trim()}` : String(valor).trim()))
    .join('\n')
}

export function mensagemContato({ nome, assunto, mensagem }) {
  return juntar([
    ['', 'Olá, RustiCerrado! Vim pelo site.'],
    ['Nome', nome],
    ['Assunto', ASSUNTOS_CONTATO[assunto] ?? assunto],
    ['Mensagem', mensagem],
  ])
}

export function mensagemPersonalizado({ nome, tipo_produto, descricao, tamanho, cores, orcamento_aproximado }) {
  return juntar([
    ['', 'Olá, RustiCerrado! Quero um orçamento de peça personalizada.'],
    ['Nome', nome],
    ['Peça', TIPOS_PERSONALIZADO[tipo_produto] ?? tipo_produto],
    ['Ideia', descricao],
    ['Tamanho', tamanho],
    ['Madeira e cores', cores],
    ['Quanto pretendo gastar', orcamento_aproximado],
  ])
}

// Abre o WhatsApp numa aba nova. Se o navegador bloquear a aba nova
// (alguns celulares fazem isso), abre na mesma aba.
export function abrirWhatsApp(link, janela = window) {
  const aba = janela.open(link, '_blank')
  if (aba) {
    aba.opener = null
  } else {
    janela.location.href = link
  }
}
