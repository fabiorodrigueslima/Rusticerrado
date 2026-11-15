/**
 * Serviço de Avaliações
 * Gerencia avaliações e comentários de produtos
 */

import { api } from './api';

const reviewService = {
  /**
   * Obter avaliações de um produto
   * @param {number} produtoId - ID do produto
   * @param {Object} opcoes - Opções (pagina, limite, ordenacao)
   * @returns {Promise} Lista de avaliações
   */
  obterAvaliacoes: async (produtoId, opcoes = {}) => {
    try {
      const params = new URLSearchParams();
      if (opcoes.pagina) params.append('pagina', opcoes.pagina);
      if (opcoes.limite) params.append('limite', opcoes.limite);
      if (opcoes.ordenacao) params.append('ordenacao', opcoes.ordenacao);

      const queryString = params.toString();
      const endpoint = queryString 
        ? `/produtos/${produtoId}/avaliacoes?${queryString}`
        : `/produtos/${produtoId}/avaliacoes`;

      return await api.get(endpoint);
    } catch (error) {
      throw new Error('Erro ao obter avaliações');
    }
  },

  /**
   * Criar nova avaliação
   * @param {number} produtoId - ID do produto
   * @param {Object} dados - Dados da avaliação
   * @returns {Promise} Avaliação criada
   */
  criarAvaliacao: async (produtoId, dados) => {
    try {
      return await api.post(`/produtos/${produtoId}/avaliacoes`, {
        estrelas: dados.estrelas,
        titulo: dados.titulo,
        comentario: dados.comentario,
        fotos: dados.fotos || []
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao criar avaliação');
    }
  },

  /**
   * Atualizar avaliação
   * @param {number} avaliacaoId - ID da avaliação
   * @param {Object} dados - Dados a atualizar
   * @returns {Promise} Avaliação atualizada
   */
  atualizarAvaliacao: async (avaliacaoId, dados) => {
    try {
      return await api.put(`/avaliacoes/${avaliacaoId}`, {
        estrelas: dados.estrelas,
        titulo: dados.titulo,
        comentario: dados.comentario
      });
    } catch (error) {
      throw new Error('Erro ao atualizar avaliação');
    }
  },

  /**
   * Deletar avaliação
   * @param {number} avaliacaoId - ID da avaliação
   * @returns {Promise} Confirmação
   */
  deletarAvaliacao: async (avaliacaoId) => {
    try {
      return await api.delete(`/avaliacoes/${avaliacaoId}`);
    } catch (error) {
      throw new Error('Erro ao deletar avaliação');
    }
  },

  /**
   * Marcar avaliação como útil
   * @param {number} avaliacaoId - ID da avaliação
   * @returns {Promise} Confirmação
   */
  marcarComoUtil: async (avaliacaoId) => {
    try {
      return await api.post(`/avaliacoes/${avaliacaoId}/util`);
    } catch (error) {
      throw new Error('Erro ao marcar como útil');
    }
  },

  /**
   * Reportar avaliação
   * @param {number} avaliacaoId - ID da avaliação
   * @param {string} motivo - Motivo do report
   * @returns {Promise} Confirmação
   */
  reportarAvaliacao: async (avaliacaoId, motivo) => {
    try {
      return await api.post(`/avaliacoes/${avaliacaoId}/reportar`, { motivo });
    } catch (error) {
      throw new Error('Erro ao reportar avaliação');
    }
  },

  /**
   * Responder avaliação (apenas vendedor)
   * @param {number} avaliacaoId - ID da avaliação
   * @param {string} resposta - Texto da resposta
   * @returns {Promise} Resposta criada
   */
  responderAvaliacao: async (avaliacaoId, resposta) => {
    try {
      return await api.post(`/avaliacoes/${avaliacaoId}/resposta`, { resposta });
    } catch (error) {
      throw new Error('Erro ao responder avaliação');
    }
  }
};

export default reviewService;