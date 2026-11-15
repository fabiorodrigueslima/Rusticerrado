// Dados oficiais da loja. Preencha somente com dados confirmados pela RustiCerrado.

// Canais de atendimento.
export const contact = {
  // Somente números, com DDI e DDD. Ex.: '5561999999999'
  whatsapp: '5561999952341',
  // E-mail de atendimento (aparece nas páginas de Privacidade, Termos e Trocas).
  email: '',
}

// Identificação de quem vende, exigida para lojas online (Decreto 7.962/2013).
// Aparece nas páginas de Privacidade, Termos e Trocas. PREENCHER ANTES DE VENDER PELO SITE.
export const store = {
  brand: 'RustiCerrado',
  // Razão social (ou nome completo, se for MEI/pessoa física).
  legalName: '',
  cnpj: '',
  city: '',
  // Endereço físico completo (rua, número, bairro, CEP), exigido pelo Decreto 7.962/2013.
  // Pode ser um endereço comercial ou caixa postal. Vazio: o site mostra só a cidade.
  address: '',
}

// Diz se os dados obrigatórios para vender já foram preenchidos.
export const storeIdentified = (source = store, channels = contact) =>
  Boolean(source.legalName.trim() && source.cnpj.trim() && (source.address.trim() || source.city.trim()) && channels.email.trim())

// Linha de identificação usada nas páginas legais.
export const sellerLocation = (source = store) => source.address?.trim() || source.city?.trim() || ''

export function sellerLine(source = store) {
  if (!source.legalName.trim()) return `${source.brand} (dados da empresa a preencher)`
  return [source.legalName, source.cnpj && `CNPJ ${source.cnpj}`, sellerLocation(source)].filter(Boolean).join(', ')
}

// Texto do contato por e-mail, sem quebrar a frase enquanto o e-mail não for informado.
export const emailText = (channels = contact) => channels.email.trim() || '[e-mail da loja a preencher]'
