/**
 * Serviço de Usuário
 * Gerencia perfil, dados pessoais e preferências do usuário
 */

import { api } from './api';

const userService = {
  /**
   * Obter perfil do usuário
   * @returns {Promise} Dados do usuário
   */
  obterPerfil: async () => {
    try {
      return await api.get('/usuario/perfil');
    } catch (error) {
      throw new Error('Erro ao obter perfil');
    }
  },

  /**
   * Atualizar dados pessoais
   * @param {Object} dados - Dados a atualizar
   * @returns {Promise} Dados atualizados
   */
  atualizarDados: async (dados) => {
    try {
      return await api.put('/usuario/dados', {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        data_nascimento: dados.data_nascimento,
        cpf: dados.cpf
      });
    } catch (error) {
      throw new Error('Erro ao atualizar dados');
    }
  },

  /**
   * Atualizar foto de perfil
   * @param {File} arquivo - Arquivo da foto
   * @returns {Promise} URL da foto
   */
  atualizarFoto: async (arquivo) => {
    try {
      const formData = new FormData();
      formData.append('foto', arquivo);

      const response = await fetch('/api/usuario/foto', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('rusticerrado_token')}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Erro ao fazer upload');
      return await response.json();
    } catch (error) {
      throw new Error('Erro ao atualizar foto');
    }
  },

  /**
   * Alterar senha
   * @param {string} senhaAtual - Senha atual
   * @param {string} novaSenha - Nova senha
   * @returns {Promise} Confirmação
   */
  alterarSenha: async (senhaAtual, novaSenha) => {
    try {
      return await api.post('/usuario/alterar-senha', {
        senhaAtual,
        novaSenha
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao alterar senha');
    }
  },

  /**
   * Obter endereços salvos
   * @returns {Promise} Lista de endereços
   */
  obterEnderecos: async () => {
    try {
      return await api.get('/usuario/enderecos');
    } catch (error) {
      throw new Error('Erro ao obter endereços');
    }
  },

  /**
   * Adicionar novo endereço
   * @param {Object} endereco - Dados do endereço
   * @returns {Promise} Endereço criado
   */
  adicionarEndereco: async (endereco) => {
    try {
      return await api.post('/usuario/enderecos', {
        tipo: endereco.tipo,
        logradouro: endereco.logradouro,
        numero: endereco.numero,
        complemento: endereco.complemento,
        bairro: endereco.bairro,
        cidade: endereco.cidade,
        estado: endereco.estado,
        cep: endereco.cep,
        principal: endereco.principal
      });
    } catch (error) {
      throw new Error('Erro ao adicionar endereço');
    }
  },

  /**
   * Atualizar endereço
   * @param {number} enderecoId - ID do endereço
   * @param {Object} endereco - Dados do endereço
   * @returns {Promise} Endereço atualizado
   */
  atualizarEndereco: async (enderecoId, endereco) => {
    try {
      return await api.put(`/usuario/enderecos/${enderecoId}`, endereco);
    } catch (error) {
      throw new Error('Erro ao atualizar endereço');
    }
  },

  /**
   * Remover endereço
   * @param {number} enderecoId - ID do endereço
   * @returns {Promise} Confirmação
   */
  removerEndereco: async (enderecoId) => {
    try {
      return await api.delete(`/usuario/enderecos/${enderecoId}`);
    } catch (error) {
      throw new Error('Erro ao remover endereço');
    }
  },

  /**
   * Obter preferências
   * @returns {Promise} Preferências do usuário
   */
  obterPreferencias: async () => {
    try {
      return await api.get('/usuario/preferencias');
    } catch (error) {
      throw new Error('Erro ao obter preferências');
    }
  },

  /**
   * Atualizar preferências
   * @param {Object} preferencias - Preferências a atualizar
   * @returns {Promise} Preferências atualizadas
   */
  atualizarPreferencias: async (preferencias) => {
    try {
      return await api.put('/usuario/preferencias', preferencias);
    } catch (error) {
      throw new Error('Erro ao atualizar preferências');
    }
  },

  /**
   * Deletar conta
   * @param {string} senha - Senha para confirmação
   * @returns {Promise} Confirmação
   */
  deletarConta: async (senha) => {
    try {
      return await api.post('/usuario/deletar-conta', { senha });
    } catch (error) {
      throw new Error('Erro ao deletar conta');
    }
  }
};

export default userService;