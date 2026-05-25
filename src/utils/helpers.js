/**
 * Funções Auxiliares
 * Funções gerais e utilitárias
 */

/**
 * Aguardar por um tempo
 * @param {number} ms - Milissegundos a aguardar
 * @returns {Promise} Promise que resolve após o tempo
 */
export const aguardar = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Clonar objeto profundamente
 * @param {Object} obj - Objeto a clonar
 * @returns {Object} Objeto clonado
 */
export const clonarObjeto = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Mesclar objetos
 * @param {...Object} objetos - Objetos a mesclar
 * @returns {Object} Objeto mesclado
 */
export const mesclarObjetos = (...objetos) => {
  return Object.assign({}, ...objetos);
};

/**
 * Obter valor aninhado de objeto
 * @param {Object} obj - Objeto
 * @param {string} caminho - Caminho (ex: 'usuario.endereco.rua')
 * @param {*} padrao - Valor padrão se não encontrar
 * @returns {*} Valor encontrado ou padrão
 */
export const obterValorAninhado = (obj, caminho, padrao = undefined) => {
  const partes = caminho.split('.');
  let resultado = obj;

  for (const parte of partes) {
    resultado = resultado?.[parte];
    if (resultado === undefined) return padrao;
  }

  return resultado;
};

/**
 * Definir valor aninhado em objeto
 * @param {Object} obj - Objeto
 * @param {string} caminho - Caminho (ex: 'usuario.endereco.rua')
 * @param {*} valor - Valor a definir
 * @returns {Object} Objeto modificado
 */
export const definirValorAninhado = (obj, caminho, valor) => {
  const partes = caminho.split('.');
  let atual = obj;

  for (let i = 0; i < partes.length - 1; i++) {
    const parte = partes[i];
    if (!(parte in atual)) {
      atual[parte] = {};
    }
    atual = atual[parte];
  }

  atual[partes[partes.length - 1]] = valor;
  return obj;
};

/**
 * Filtrar objeto por chaves
 * @param {Object} obj - Objeto
 * @param {string[]} chaves - Chaves a manter
 * @returns {Object} Objeto filtrado
 */
export const filtrarObjeto = (obj, chaves) => {
  return chaves.reduce((resultado, chave) => {
    if (chave in obj) {
      resultado[chave] = obj[chave];
    }
    return resultado;
  }, {});
};

/**
 * Inverter objeto (chaves viram valores e vice-versa)
 * @param {Object} obj - Objeto
 * @returns {Object} Objeto invertido
 */
export const inverterObjeto = (obj) => {
  return Object.entries(obj).reduce((resultado, [chave, valor]) => {
    resultado[valor] = chave;
    return resultado;
  }, {});
};

/**
 * Ordenar array de objetos
 * @param {Array} array - Array a ordenar
 * @param {string} chave - Chave para ordenar
 * @param {string} direcao - 'asc' ou 'desc'
 * @returns {Array} Array ordenado
 */
export const ordenarArray = (array, chave, direcao = 'asc') => {
  return [...array].sort((a, b) => {
    const valorA = a[chave];
    const valorB = b[chave];

    if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
    if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Agrupar array por chave
 * @param {Array} array - Array a agrupar
 * @param {string} chave - Chave para agrupar
 * @returns {Object} Objeto com grupos
 */
export const agruparArray = (array, chave) => {
  return array.reduce((resultado, item) => {
    const grupo = item[chave];
    if (!resultado[grupo]) {
      resultado[grupo] = [];
    }
    resultado[grupo].push(item);
    return resultado;
  }, {});
};

/**
 * Paginar array
 * @param {Array} array - Array a paginar
 * @param {number} pagina - Número da página (começa em 1)
 * @param {number} porPagina - Itens por página
 * @returns {Array} Array paginado
 */
export const paginarArray = (array, pagina = 1, porPagina = 10) => {
  const inicio = (pagina - 1) * porPagina;
  const fim = inicio + porPagina;
  return array.slice(inicio, fim);
};

/**
 * Obter informações de paginação
 * @param {number} total - Total de itens
 * @param {number} pagina - Página atual
 * @param {number} porPagina - Itens por página
 * @returns {Object} Informações de paginação
 */
export const obterInfoPaginacao = (total, pagina = 1, porPagina = 10) => {
  const totalPaginas = Math.ceil(total / porPagina);
  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return {
    pagina,
    porPagina,
    total,
    totalPaginas,
    inicio,
    fim,
    temProxima: pagina < totalPaginas,
    temAnterior: pagina > 1
  };
};

/**
 * Gerar ID único
 * @returns {string} ID único
 */
export const gerarID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gerar cor aleatória
 * @returns {string} Cor em hexadecimal
 */
export const gerarCorAleatoria = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Copiar para clipboard
 * @param {string} texto - Texto a copiar
 * @returns {Promise} Promise que resolve quando copiado
 */
export const copiarParaClipboard = async (texto) => {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (erro) {
    console.error('Erro ao copiar:', erro);
    return false;
  }
};

/**
 * Download de arquivo
 * @param {string} url - URL do arquivo
 * @param {string} nome - Nome do arquivo
 */
export const baixarArquivo = (url, nome) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Ler arquivo como texto
 * @param {File} arquivo - Arquivo a ler
 * @returns {Promise} Promise com conteúdo do arquivo
 */
export const lerArquivoComoTexto = (arquivo) => {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = (e) => resolve(e.target.result);
    leitor.onerror = reject;
    leitor.readAsText(arquivo);
  });
};

/**
 * Ler arquivo como data URL
 * @param {File} arquivo - Arquivo a ler
 * @returns {Promise} Promise com data URL
 */
export const lerArquivoComoDataURL = (arquivo) => {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = (e) => resolve(e.target.result);
    leitor.onerror = reject;
    leitor.readAsDataURL(arquivo);
  });
};

/**
 * Detectar navegador
 * @returns {Object} Informações do navegador
 */
export const detectarNavegador = () => {
  const ua = navigator.userAgent;

  return {
    isChrome: /Chrome/.test(ua),
    isFirefox: /Firefox/.test(ua),
    isSafari: /Safari/.test(ua),
    isEdge: /Edg/.test(ua),
    isIE: /MSIE|Trident/.test(ua),
    isMobile: /Mobile|Android|iPhone/.test(ua),
    isTablet: /iPad|Android/.test(ua)
  };
};

/**
 * Verificar conexão com internet
 * @returns {boolean} Conectado à internet
 */
export const temConexao = () => {
  return navigator.onLine;
};

/**
 * Obter parâmetro de URL
 * @param {string} nome - Nome do parâmetro
 * @returns {string} Valor do parâmetro
 */
export const obterParametroURL = (nome) => {
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
};

/**
 * Definir parâmetro de URL
 * @param {string} nome - Nome do parâmetro
 * @param {string} valor - Valor do parâmetro
 */
export const definirParametroURL = (nome, valor) => {
  const url = new URL(window.location);
  url.searchParams.set(nome, valor);
  window.history.replaceState({}, '', url);
};

/**
 * Scroll para elemento
 * @param {string} seletor - Seletor CSS do elemento
 * @param {boolean} suave - Scroll suave
 */
export const scrollParaElemento = (seletor, suave = true) => {
  const elemento = document.querySelector(seletor);
  if (elemento) {
    elemento.scrollIntoView({ behavior: suave ? 'smooth' : 'auto' });
  }
};

/**
 * Scroll para topo
 * @param {boolean} suave - Scroll suave
 */
export const scrollParaTopo = (suave = true) => {
  window.scrollTo({
    top: 0,
    behavior: suave ? 'smooth' : 'auto'
  });
};

/**
 * Verificar se elemento está visível
 * @param {Element} elemento - Elemento a verificar
 * @returns {boolean} Elemento visível
 */
export const elementoVisivel = (elemento) => {
  const rect = elemento.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export default {
  aguardar,
  clonarObjeto,
  mesclarObjetos,
  obterValorAninhado,
  definirValorAninhado,
  filtrarObjeto,
  inverterObjeto,
  ordenarArray,
  agruparArray,
  paginarArray,
  obterInfoPaginacao,
  gerarID,
  gerarCorAleatoria,
  copiarParaClipboard,
  baixarArquivo,
  lerArquivoComoTexto,
  lerArquivoComoDataURL,
  detectarNavegador,
  temConexao,
  obterParametroURL,
  definirParametroURL,
  scrollParaElemento,
  scrollParaTopo,
  elementoVisivel
};
