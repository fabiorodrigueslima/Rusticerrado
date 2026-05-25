/**
 * Constantes da Aplicação
 * Valores fixos usados em toda a aplicação
 */

// ========== CORES ==========
export const CORES = {
  PRIMARIA: '#8B3A3A',
  SECUNDARIA: '#C97C5D',
  ESCURA: '#3D2F2F',
  CLARA: '#F4EFE8',
  SUCESSO: '#27AE60',
  ERRO: '#E74C3C',
  AVISO: '#F39C12',
  INFO: '#3498DB',
  CINZA_CLARO: '#ECF0F1',
  CINZA_ESCURO: '#7F8C8D'
};

// ========== TAMANHOS ==========
export const TAMANHOS = {
  XS: '8px',
  SM: '12px',
  MD: '16px',
  LG: '20px',
  XL: '24px',
  XXL: '32px'
};

// ========== BREAKPOINTS ==========
export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1200,
  ULTRAWIDE: 1920
};

// ========== PAGINAÇÃO ==========
export const PAGINACAO = {
  ITENS_POR_PAGINA: 12,
  ITENS_POR_PAGINA_MOBILE: 6,
  ITENS_POR_PAGINA_ADMIN: 20
};

// ========== CATEGORIAS ==========
export const CATEGORIAS = {
  TABUAS: 'tabuas',
  BANDEJAS: 'bandejas',
  VASOS: 'vasos',
  LUMINÁRIAS: 'luminárias',
  CAIXAS: 'caixas',
  ACESSÓRIOS: 'acessórios',
  ESPELHOS: 'espelhos',
  SUPORTES: 'suportes',
  COPOS: 'copos',
  RELÓGIOS: 'relógios'
};

// ========== STATUS DE PEDIDO ==========
export const STATUS_PEDIDO = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  PROCESSANDO: 'processando',
  ENVIADO: 'enviado',
  ENTREGUE: 'entregue',
  CANCELADO: 'cancelado',
  DEVOLVIDO: 'devolvido'
};

export const LABELS_STATUS_PEDIDO = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  processando: 'Processando',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
  devolvido: 'Devolvido'
};

// ========== MÉTODOS DE PAGAMENTO ==========
export const METODOS_PAGAMENTO = {
  CARTAO: 'cartao',
  BOLETO: 'boleto',
  PIX: 'pix',
  TRANSFERENCIA: 'transferencia'
};

export const LABELS_METODOS_PAGAMENTO = {
  cartao: 'Cartão de Crédito',
  boleto: 'Boleto Bancário',
  pix: 'PIX',
  transferencia: 'Transferência Bancária'
};

// ========== TRANSPORTADORAS ==========
export const TRANSPORTADORAS = {
  CORREIOS: 'correios',
  SEDEX: 'sedex',
  LOGGI: 'loggi',
  JADLOG: 'jadlog'
};

export const LABELS_TRANSPORTADORAS = {
  correios: 'Correios PAC',
  sedex: 'Correios SEDEX',
  loggi: 'Loggi',
  jadlog: 'JadLog'
};

// ========== TIPOS DE ENDEREÇO ==========
export const TIPOS_ENDERECO = {
  RESIDENCIAL: 'residencial',
  COMERCIAL: 'comercial',
  OUTRO: 'outro'
};

export const LABELS_TIPOS_ENDERECO = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  outro: 'Outro'
};

// ========== PRIORIDADES DE TICKET ==========
export const PRIORIDADES_TICKET = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente'
};

export const LABELS_PRIORIDADES_TICKET = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

// ========== CATEGORIAS DE TICKET ==========
export const CATEGORIAS_TICKET = {
  DUVIDA: 'duvida',
  DEFEITO: 'defeito',
  ATRASO: 'atraso',
  DEVOLUCAO: 'devolucao',
  OUTRO: 'outro'
};

export const LABELS_CATEGORIAS_TICKET = {
  duvida: 'Dúvida',
  defeito: 'Produto com Defeito',
  atraso: 'Atraso na Entrega',
  devolucao: 'Devolução',
  outro: 'Outro'
};

// ========== MENSAGENS ==========
export const MENSAGENS = {
  SUCESSO: 'Operação realizada com sucesso!',
  ERRO_GENERICO: 'Ocorreu um erro. Tente novamente.',
  ERRO_CONEXAO: 'Erro de conexão. Verifique sua internet.',
  ERRO_AUTENTICACAO: 'Erro de autenticação. Faça login novamente.',
  ERRO_PERMISSAO: 'Você não tem permissão para esta ação.',
  CARREGANDO: 'Carregando...',
  ENVIANDO: 'Enviando...',
  SALVANDO: 'Salvando...',
  DELETANDO: 'Deletando...'
};

// ========== VALIDAÇÕES ==========
export const VALIDACOES = {
  SENHA_MINIMA: 8,
  NOME_MINIMO: 3,
  NOME_MAXIMO: 100,
  DESCRICAO_MINIMA: 10,
  DESCRICAO_MAXIMA: 5000,
  TAMANHO_MAX_ARQUIVO: 5 * 1024 * 1024, // 5MB
  TIPOS_ARQUIVO_IMAGEM: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
};

// ========== LINKS EXTERNOS ==========
export const LINKS = {
  INSTAGRAM: 'https://www.instagram.com/rusticerrado/',
  FACEBOOK: 'https://www.facebook.com/rusticerrado',
  PINTEREST: 'https://www.pinterest.com/rusticerrado',
  TIKTOK: 'https://www.tiktok.com/@rusticerrado',
  WHATSAPP: 'https://wa.me/5561999952341'
};

// ========== CONTATO ==========
export const CONTATO = {
  EMAIL: 'contato@rusticerrado.com.br',
  TELEFONE: '(61) 99999-2341',
  WHATSAPP: '5561999952341',
  ENDERECO: 'Brasília, DF - Brasil'
};

// ========== HORÁRIOS ==========
export const HORARIOS = {
  SEGUNDA: '09:00 - 18:00',
  TERCA: '09:00 - 18:00',
  QUARTA: '09:00 - 18:00',
  QUINTA: '09:00 - 18:00',
  SEXTA: '09:00 - 18:00',
  SABADO: '10:00 - 14:00',
  DOMINGO: 'Fechado'
};

// ========== PRAZOS ==========
export const PRAZOS = {
  FRETE_MINIMO: 5, // dias
  FRETE_MAXIMO: 15, // dias
  PROCESSAMENTO: 2, // dias
  DEVOLUCAO: 30 // dias
};

// ========== DESCONTOS ==========
export const DESCONTOS = {
  PRIMEIRA_COMPRA: 0.10, // 10%
  CLIENTE_VIP: 0.15, // 15%
  CUPOM_ESPECIAL: 0.20 // 20%
};

// ========== MOEDA ==========
export const MOEDA = {
  SIMBOLO: 'R$',
  CODIGO: 'BRL',
  LOCALE: 'pt-BR'
};

// ========== CACHE ==========
export const CACHE = {
  DURACAO_PRODUTOS: 1000 * 60 * 60, // 1 hora
  DURACAO_USUARIO: 1000 * 60 * 30, // 30 minutos
  DURACAO_CARRINHO: 1000 * 60 * 60 * 24 // 24 horas
};

// ========== ANIMAÇÕES ==========
export const ANIMACOES = {
  DURACAO_RAPIDA: 200, // ms
  DURACAO_NORMAL: 300, // ms
  DURACAO_LENTA: 500 // ms
};

// ========== REGEX ==========
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TELEFONE: /^\(\d{2}\)\s?\d{4,5}-\d{4}$/,
  CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  CEP: /^\d{5}-\d{3}$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
};

// ========== ROTAS ==========
export const ROTAS = {
  HOME: '/',
  LOJA: '/loja',
  PRODUTO: '/produto/:id',
  CARRINHO: '/carrinho',
  CHECKOUT: '/checkout',
  SUCESSO: '/sucesso',
  CONTATO: '/contato',
  LOGIN: '/login',
  CADASTRO: '/cadastro',
  RECUPERAR_SENHA: '/recuperar-senha',
  PERFIL: '/perfil',
  PEDIDOS: '/pedidos',
  PERSONALIZADOS: '/personalizados'
};

export default {
  CORES,
  TAMANHOS,
  BREAKPOINTS,
  PAGINACAO,
  CATEGORIAS,
  STATUS_PEDIDO,
  LABELS_STATUS_PEDIDO,
  METODOS_PAGAMENTO,
  LABELS_METODOS_PAGAMENTO,
  TRANSPORTADORAS,
  LABELS_TRANSPORTADORAS,
  TIPOS_ENDERECO,
  LABELS_TIPOS_ENDERECO,
  PRIORIDADES_TICKET,
  LABELS_PRIORIDADES_TICKET,
  CATEGORIAS_TICKET,
  LABELS_CATEGORIAS_TICKET,
  MENSAGENS,
  VALIDACOES,
  LINKS,
  CONTATO,
  HORARIOS,
  PRAZOS,
  DESCONTOS,
  MOEDA,
  CACHE,
  ANIMACOES,
  REGEX,
  ROTAS
};
