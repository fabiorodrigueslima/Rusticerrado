/**
 * Funções de Validação
 * Valida dados de entrada
 */

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} Email válido
 */
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validar senha
 * @param {string} senha - Senha a validar
 * @returns {Object} { valida: boolean, erros: string[] }
 */
export const validarSenha = (senha) => {
  const erros = [];

  if (!senha) {
    erros.push('Senha é obrigatória');
    return { valida: false, erros };
  }

  if (senha.length < 8) {
    erros.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (!/[A-Z]/.test(senha)) {
    erros.push('Senha deve conter pelo menos uma letra maiúscula');
  }

  if (!/[a-z]/.test(senha)) {
    erros.push('Senha deve conter pelo menos uma letra minúscula');
  }

  if (!/[0-9]/.test(senha)) {
    erros.push('Senha deve conter pelo menos um número');
  }

  if (!/[!@#$%^&*]/.test(senha)) {
    erros.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*)');
  }

  return {
    valida: erros.length === 0,
    erros
  };
};

/**
 * Validar CPF
 * @param {string} cpf - CPF a validar
 * @returns {boolean} CPF válido
 */
export const validarCPF = (cpf) => {
  if (!cpf) return false;

  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Validar primeiro dígito verificador
  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(9, 10))) return false;

  // Validar segundo dígito verificador
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo.substring(10, 11))) return false;

  return true;
};

/**
 * Validar CEP
 * @param {string} cep - CEP a validar
 * @returns {boolean} CEP válido
 */
export const validarCEP = (cep) => {
  if (!cep) return false;
  const limpo = cep.replace(/\D/g, '');
  return limpo.length === 8;
};

/**
 * Validar telefone
 * @param {string} telefone - Telefone a validar
 * @returns {boolean} Telefone válido
 */
export const validarTelefone = (telefone) => {
  if (!telefone) return false;
  const limpo = telefone.replace(/\D/g, '');
  return limpo.length === 10 || limpo.length === 11;
};

/**
 * Validar número de cartão
 * @param {string} numero - Número do cartão
 * @returns {boolean} Cartão válido (algoritmo de Luhn)
 */
export const validarCartao = (numero) => {
  if (!numero) return false;

  const limpo = numero.replace(/\D/g, '');

  if (limpo.length < 13 || limpo.length > 19) return false;

  let soma = 0;
  let dobro = false;

  for (let i = limpo.length - 1; i >= 0; i--) {
    let digito = parseInt(limpo.charAt(i), 10);

    if (dobro) {
      digito *= 2;
      if (digito > 9) {
        digito -= 9;
      }
    }

    soma += digito;
    dobro = !dobro;
  }

  return soma % 10 === 0;
};

/**
 * Validar data
 * @param {string|Date} data - Data a validar
 * @returns {boolean} Data válida
 */
export const validarData = (data) => {
  if (!data) return false;

  const d = new Date(data);
  return d instanceof Date && !isNaN(d);
};

/**
 * Validar data de nascimento
 * @param {string} data - Data de nascimento
 * @returns {Object} { valida: boolean, erro: string }
 */
export const validarDataNascimento = (data) => {
  if (!validarData(data)) {
    return { valida: false, erro: 'Data inválida' };
  }

  const hoje = new Date();
  const nascimento = new Date(data);
  const idade = hoje.getFullYear() - nascimento.getFullYear();

  if (idade < 18) {
    return { valida: false, erro: 'Você deve ter no mínimo 18 anos' };
  }

  if (idade > 120) {
    return { valida: false, erro: 'Data de nascimento inválida' };
  }

  return { valida: true };
};

/**
 * Validar URL
 * @param {string} url - URL a validar
 * @returns {boolean} URL válida
 */
export const validarURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validar arquivo
 * @param {File} arquivo - Arquivo a validar
 * @param {Object} opcoes - Opções { maxSize, tipos }
 * @returns {Object} { valido: boolean, erro: string }
 */
export const validarArquivo = (arquivo, opcoes = {}) => {
  const maxSize = opcoes.maxSize || 5 * 1024 * 1024; // 5MB padrão
  const tipos = opcoes.tipos || ['image/jpeg', 'image/png', 'image/gif'];

  if (!arquivo) {
    return { valido: false, erro: 'Arquivo não selecionado' };
  }

  if (arquivo.size > maxSize) {
    return { valido: false, erro: `Arquivo maior que ${maxSize / 1024 / 1024}MB` };
  }

  if (!tipos.includes(arquivo.type)) {
    return { valido: false, erro: `Tipo de arquivo não permitido: ${arquivo.type}` };
  }

  return { valido: true };
};

/**
 * Validar nome
 * @param {string} nome - Nome a validar
 * @returns {Object} { valido: boolean, erro: string }
 */
export const validarNome = (nome) => {
  if (!nome) {
    return { valido: false, erro: 'Nome é obrigatório' };
  }

  if (nome.length < 3) {
    return { valido: false, erro: 'Nome deve ter no mínimo 3 caracteres' };
  }

  if (nome.length > 100) {
    return { valido: false, erro: 'Nome muito longo' };
  }

  return { valido: true };
};

/**
 * Validar quantidade
 * @param {number} quantidade - Quantidade a validar
 * @param {number} minima - Quantidade mínima
 * @param {number} maxima - Quantidade máxima
 * @returns {Object} { valida: boolean, erro: string }
 */
export const validarQuantidade = (quantidade, minima = 1, maxima = 999) => {
  if (quantidade === null || quantidade === undefined) {
    return { valida: false, erro: 'Quantidade é obrigatória' };
  }

  const num = parseInt(quantidade);

  if (isNaN(num)) {
    return { valida: false, erro: 'Quantidade deve ser um número' };
  }

  if (num < minima) {
    return { valida: false, erro: `Quantidade mínima é ${minima}` };
  }

  if (num > maxima) {
    return { valida: false, erro: `Quantidade máxima é ${maxima}` };
  }

  return { valida: true };
};

/**
 * Validar preço
 * @param {number} preco - Preço a validar
 * @returns {Object} { valido: boolean, erro: string }
 */
export const validarPreco = (preco) => {
  if (preco === null || preco === undefined) {
    return { valido: false, erro: 'Preço é obrigatório' };
  }

  const num = parseFloat(preco);

  if (isNaN(num)) {
    return { valido: false, erro: 'Preço deve ser um número' };
  }

  if (num < 0) {
    return { valido: false, erro: 'Preço não pode ser negativo' };
  }

  return { valido: true };
};

/**
 * Validar formulário completo
 * @param {Object} dados - Dados do formulário
 * @param {Object} regras - Regras de validação
 * @returns {Object} { valido: boolean, erros: {} }
 */
export const validarFormulario = (dados, regras) => {
  const erros = {};

  for (const [campo, regra] of Object.entries(regras)) {
    const valor = dados[campo];

    if (regra.obrigatorio && (!valor || valor.toString().trim() === '')) {
      erros[campo] = `${regra.label || campo} é obrigatório`;
      continue;
    }

    if (regra.tipo === 'email' && valor && !validarEmail(valor)) {
      erros[campo] = 'Email inválido';
      continue;
    }

    if (regra.tipo === 'cpf' && valor && !validarCPF(valor)) {
      erros[campo] = 'CPF inválido';
      continue;
    }

    if (regra.tipo === 'telefone' && valor && !validarTelefone(valor)) {
      erros[campo] = 'Telefone inválido';
      continue;
    }

    if (regra.minimo && valor && valor.length < regra.minimo) {
      erros[campo] = `${regra.label || campo} deve ter no mínimo ${regra.minimo} caracteres`;
      continue;
    }

    if (regra.maximo && valor && valor.length > regra.maximo) {
      erros[campo] = `${regra.label || campo} deve ter no máximo ${regra.maximo} caracteres`;
      continue;
    }
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros
  };
};

export default {
  validarEmail,
  validarSenha,
  validarCPF,
  validarCEP,
  validarTelefone,
  validarCartao,
  validarData,
  validarDataNascimento,
  validarURL,
  validarArquivo,
  validarNome,
  validarQuantidade,
  validarPreco,
  validarFormulario
};
