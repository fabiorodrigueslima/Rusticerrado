/**
 * Serviço de Autenticação
 * Gerencia login, cadastro, logout e recuperação de senha
 */

import { api } from './api';

const authService = {
  /**
   * Fazer login
   * @param {string} email - Email do usuário
   * @param {string} senha - Senha do usuário
   * @returns {Promise} Dados do usuário e token
   */
  login: async (email, senha) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        senha
      });

      // Salvar token e usuário
      if (response.token) {
        localStorage.setItem('rusticerrado_token', response.token);
        localStorage.setItem('rusticerrado_user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  },

  /**
   * Fazer cadastro
   * @param {Object} dados - Dados do novo usuário
   * @returns {Promise} Dados do usuário criado
   */
  cadastro: async (dados) => {
    try {
      const response = await api.post('/auth/cadastro', {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        senha: dados.senha
      });

      // Salvar token e usuário
      if (response.token) {
        localStorage.setItem('rusticerrado_token', response.token);
        localStorage.setItem('rusticerrado_user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Erro ao criar conta');
    }
  },

  /**
   * Fazer logout
   */
  logout: () => {
    localStorage.removeItem('rusticerrado_token');
    localStorage.removeItem('rusticerrado_user');
  },

  /**
   * Recuperar senha
   * @param {string} email - Email do usuário
   * @returns {Promise} Confirmação de envio
   */
  recuperarSenha: async (email) => {
    try {
      return await api.post('/auth/recuperar-senha', { email });
    } catch (error) {
      throw new Error(error.message || 'Erro ao recuperar senha');
    }
  },

  /**
   * Resetar senha
   * @param {string} token - Token de reset
   * @param {string} novaSenha - Nova senha
   * @returns {Promise} Confirmação
   */
  resetarSenha: async (token, novaSenha) => {
    try {
      return await api.post('/auth/resetar-senha', {
        token,
        novaSenha
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao resetar senha');
    }
  },

  /**
   * Verificar se está autenticado
   * @returns {boolean}
   */
  estaAutenticado: () => {
    return !!localStorage.getItem('rusticerrado_token');
  },

  /**
   * Obter usuário atual
   * @returns {Object} Dados do usuário
   */
  obterUsuarioAtual: () => {
    const user = localStorage.getItem('rusticerrado_user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Obter token
   * @returns {string} Token de autenticação
   */
  obterToken: () => {
    return localStorage.getItem('rusticerrado_token');
  }
};

export default authService;