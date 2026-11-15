/**
 * Funções de Formatação
 * Formata dados para exibição
 */

/**
 * Formatar preço em reais
 * @param {number} valor - Valor em reais
 * @returns {string} Valor formatado (R$ 123,45)
 */
export const formatarPreco = (valor) => {
  if (!valor && valor !== 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

/**
 * Formatar data em português
 * @param {string|Date} data - Data a formatar
 * @param {string} formato - Formato desejado ('curto', 'longo', 'completo')
 * @returns {string} Data formatada
 */
export const formatarData = (data, formato = "curto") => {
  if (!data) return "";

  const d = new Date(data);
  const opcoes = {
    curto: { day: "2-digit", month: "2-digit", year: "numeric" },
    longo: { day: "numeric", month: "long", year: "numeric" },
    completo: {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  };

  return d.toLocaleDateString("pt-BR", opcoes[formato] || opcoes.curto);
};

/**
 * Formatar hora
 * @param {string|Date} data - Data/hora a formatar
 * @returns {string} Hora formatada (14:30)
 */
export const formatarHora = (data) => {
  if (!data) return "";
  const d = new Date(data);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

/**
 * Formatar telefone
 * @param {string} telefone - Telefone sem formatação
 * @returns {string} Telefone formatado ((11) 99999-9999)
 */
export const formatarTelefone = (telefone) => {
  if (!telefone) return "";
  const limpo = telefone.replace(/\D/g, "");

  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  } else if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }

  return telefone;
};

/**
 * Formatar CPF
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado (123.456.789-10)
 */
export const formatarCPF = (cpf) => {
  if (!cpf) return "";
  const limpo = cpf.replace(/\D/g, "");

  if (limpo.length !== 11) return cpf;

  return `${limpo.slice(0, 3)}.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-${limpo.slice(9)}`;
};

/**
 * Formatar CEP
 * @param {string} cep - CEP sem formatação
 * @returns {string} CEP formatado (70000-000)
 */
export const formatarCEP = (cep) => {
  if (!cep) return "";
  const limpo = cep.replace(/\D/g, "");

  if (limpo.length !== 8) return cep;

  return `${limpo.slice(0, 5)}-${limpo.slice(5)}`;
};

/**
 * Formatar número de cartão
 * @param {string} numero - Número do cartão sem formatação
 * @returns {string} Número formatado (1234 5678 9012 3456)
 */
export const formatarCartao = (numero) => {
  if (!numero) return "";
  const limpo = numero.replace(/\D/g, "");
  return limpo.replace(/(\d{4})(?=\d)/g, "$1 ");
};

/**
 * Formatar quantidade com unidade
 * @param {number} quantidade - Quantidade
 * @param {string} unidade - Unidade (kg, l, m, etc)
 * @returns {string} Quantidade formatada (2,5 kg)
 */
export const formatarQuantidade = (quantidade, unidade = "") => {
  if (quantidade === null || quantidade === undefined) return "";
  const formatado = quantidade.toLocaleString("pt-BR");
  return unidade ? `${formatado} ${unidade}` : formatado;
};

/**
 * Formatar dimensões
 * @param {number} comprimento - Comprimento em cm
 * @param {number} largura - Largura em cm
 * @param {number} altura - Altura em cm
 * @returns {string} Dimensões formatadas (40cm x 25cm x 2cm)
 */
export const formatarDimensoes = (comprimento, largura, altura) => {
  return `${comprimento}cm x ${largura}cm x ${altura}cm`;
};

/**
 * Formatar peso
 * @param {number} peso - Peso em gramas
 * @returns {string} Peso formatado (850g ou 0,85kg)
 */
export const formatarPeso = (peso) => {
  if (!peso) return "";

  if (peso >= 1000) {
    return `${(peso / 1000).toFixed(2).replace(".", ",")}kg`;
  }

  return `${peso}g`;
};

/**
 * Formatar percentual
 * @param {number} valor - Valor em decimal (0.15 = 15%)
 * @returns {string} Percentual formatado (15%)
 */
export const formatarPercentual = (valor) => {
  if (valor === null || valor === undefined) return "";
  return `${(valor * 100).toFixed(0)}%`;
};

/**
 * Formatar texto com limite de caracteres
 * @param {string} texto - Texto original
 * @param {number} limite - Limite de caracteres
 * @returns {string} Texto truncado com reticências
 */
export const truncarTexto = (texto, limite = 100) => {
  if (!texto) return "";
  if (texto.length <= limite) return texto;
  return texto.slice(0, limite) + "...";
};

/**
 * Capitalizar primeira letra
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export const capitalizarPrimeira = (texto) => {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

/**
 * Capitalizar todas as palavras
 * @param {string} texto - Texto a capitalizar
 * @returns {string} Texto com todas as palavras capitalizadas
 */
export const capitalizarPalavras = (texto) => {
  if (!texto) return "";
  return texto
    .split(" ")
    .map((palavra) => capitalizarPrimeira(palavra))
    .join(" ");
};

/**
 * Converter para slug (URL-friendly)
 * @param {string} texto - Texto a converter
 * @returns {string} Slug (exemplo-de-slug)
 */
export const paraSlug = (texto) => {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

/**
 * Remover acentos
 * @param {string} texto - Texto com acentos
 * @returns {string} Texto sem acentos
 */
export const removerAcentos = (texto) => {
  if (!texto) return "";
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default {
  formatarPreco,
  formatarData,
  formatarHora,
  formatarTelefone,
  formatarCPF,
  formatarCEP,
  formatarCartao,
  formatarQuantidade,
  formatarDimensoes,
  formatarPeso,
  formatarPercentual,
  truncarTexto,
  capitalizarPrimeira,
  capitalizarPalavras,
  paraSlug,
  removerAcentos,
};
