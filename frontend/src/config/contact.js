// Dados oficiais da loja. Preencha somente com dados confirmados pela RustiCerrado.

// Canais de atendimento. É o ÚNICO lugar com o WhatsApp e as redes: o site inteiro lê daqui
// (cabeçalho, rodapé, botão verde, Contato, Loja, peça, Personalizados, páginas legais).
export const contact = {
  // Somente números, com DDI e DDD. Ex.: '5561999999999'
  whatsapp: '5561999952341',
  instagram: 'https://www.instagram.com/rusticerrado/',
  facebook: 'https://www.facebook.com/rusticerrado',
  // E-mail de atendimento (aparece nas páginas de Privacidade, Termos e Trocas).
  // Preencher quando o e-mail da loja estiver funcionando.
  email: '',
}

// "5561999952341" -> "(61) 99995-2341"
export function formatPhone(digits = contact.whatsapp) {
  const match = String(digits).match(/^55(\d{2})(\d{4,5})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : `+${digits}`
}

// Link para conversar no WhatsApp da loja, já com a mensagem escrita (opcional).
export function whatsappLink(text, digits = contact.whatsapp) {
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
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
