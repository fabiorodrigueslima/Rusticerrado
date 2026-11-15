/**
 * Serviço de Contato
 * Gerencia formulários de contato e suporte
 */

import { api } from './api';

const contactService = {
  /**
   * Enviar mensagem de contato
   * @param {Object} dados - Dados da mensagem
   * @returns {Promise} Confirmação
   */
  enviarMensagem: async (dados) => {
    try {
      return await api.post('/contato', {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        assunto: dados.assunto,
        mensagem: dados.mensagem
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao enviar mensagem');
    }
  },

  /**
   * Solicitar produto personalizado
   * @param {Object} dados - Dados da solicitação
   * @returns {Promise} Confirmação
   */
  solicitarPersonalizacao: async (dados) => {
    try {
      return await api.post('/personalizacao/solicitar', {
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        descricao: dados.descricao,
        fotos: dados.fotos || [],
        orcamento: dados.orcamento
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao solicitar personalização');
    }
  },

  /**
   * Obter solicitações de personalização do usuário
   * @returns {Promise} Lista de solicitações
   */
  obterSolicitacoes: async () => {
    try {
      return await api.get('/personalizacao/minhas-solicitacoes');
    } catch (error) {
      throw new Error('Erro ao obter solicitações');
    }
  },

  /**
   * Obter detalhes de uma solicitação
   * @param {number} solicitacaoId - ID da solicitação
   * @returns {Promise} Dados da solicitação
   */
  obterSolicitacao: async (solicitacaoId) => {
    try {
      return await api.get(`/personalizacao/${solicitacaoId}`);
    } catch (error) {
      throw new Error('Erro ao obter solicitação');
    }
  },

  /**
   * Cancelar solicitação de personalização
   * @param {number} solicitacaoId - ID da solicitação
   * @returns {Promise} Confirmação
   */
  cancelarSolicitacao: async (solicitacaoId) => {
    try {
      return await api.post(`/personalizacao/${solicitacaoId}/cancelar`);
    } catch (error) {
      throw new Error('Erro ao cancelar solicitação');
    }
  },

  /**
   * Enviar ticket de suporte
   * @param {Object} dados - Dados do ticket
   * @returns {Promise} Ticket criado
   */
  criarTicketSuporte: async (dados) => {
    try {
      return await api.post('/suporte/tickets', {
        titulo: dados.titulo,
        descricao: dados.descricao,
        categoria: dados.categoria,
        prioridade: dados.prioridade,
        pedidoId: dados.pedidoId || null
      });
    } catch (error) {
      throw new Error('Erro ao criar ticket de suporte');
    }
  },

  /**
   * Obter tickets de suporte do usuário
   * @returns {Promise} Lista de tickets
   */
  obterTickets: async () => {
    try {
      return await api.get('/suporte/meus-tickets');
    } catch (error) {
      throw new Error('Erro ao obter tickets');
    }
  },

  /**
   * Obter detalhes de um ticket
   * @param {number} ticketId - ID do ticket
   * @returns {Promise} Dados do ticket
   */
  obterTicket: async (ticketId) => {
    try {
      return await api.get(`/suporte/tickets/${ticketId}`);
    } catch (error) {
      throw new Error('Erro ao obter ticket');
    }
  },

  /**
   * Adicionar resposta ao ticket
   * @param {number} ticketId - ID do ticket
   * @param {string} mensagem - Mensagem
   * @returns {Promise} Resposta criada
   */
  responderTicket: async (ticketId, mensagem) => {
    try {
      return await api.post(`/suporte/tickets/${ticketId}/respostas`, {
        mensagem
      });
    } catch (error) {
      throw new Error('Erro ao responder ticket');
    }
  },

  /**
   * Fechar ticket
   * @param {number} ticketId - ID do ticket
   * @returns {Promise} Confirmação
   */
  fecharTicket: async (ticketId) => {
    try {
      return await api.post(`/suporte/tickets/${ticketId}/fechar`);
    } catch (error) {
      throw new Error('Erro ao fechar ticket');
    }
  },

  /**
   * Inscrever em newsletter
   * @param {string} email - Email
   * @returns {Promise} Confirmação
   */
  inscreverNewsletter: async (email) => {
    try {
      return await api.post('/newsletter/inscrever', { email });
    } catch (error) {
      throw new Error('Erro ao inscrever na newsletter');
    }
  },

  /**
   * Desinscrever de newsletter
   * @param {string} email - Email
   * @returns {Promise} Confirmação
   */
  desinscreverNewsletter: async (email) => {
    try {
      return await api.post('/newsletter/desinscrever', { email });
    } catch (error) {
      throw new Error('Erro ao desinscrever da newsletter');
    }
  }
};

export default contactService;