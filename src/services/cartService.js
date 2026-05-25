/**
 * Serviço de Carrinho
 * Gerencia operações do carrinho e checkout
 */

import { api } from './api';

const cartService = {
  /**
   * Criar pedido a partir do carrinho
   * @param {Array} itens - Itens do carrinho
   * @param {Object} dados - Dados do pedido (endereço, etc)
   * @returns {Promise} Dados do pedido criado
   */
  criarPedido: async (itens, dados) => {
    try {
      return await api.post('/pedidos', {
        itens,
        endereco: dados.endereco,
        cidade: dados.cidade,
        estado: dados.estado,
        cep: dados.cep,
        telefone: dados.telefone,
        observacoes: dados.observacoes
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao criar pedido');
    }
  },

  /**
   * Obter pedidos do usuário
   * @returns {Promise} Lista de pedidos
   */
  obterPedidos: async () => {
    try {
      return await api.get('/pedidos');
    } catch (error) {
      throw new Error('Erro ao obter pedidos');
    }
  },

  /**
   * Obter detalhes de um pedido
   * @param {number} pedidoId - ID do pedido
   * @returns {Promise} Dados do pedido
   */
  obterPedido: async (pedidoId) => {
    try {
      return await api.get(`/pedidos/${pedidoId}`);
    } catch (error) {
      throw new Error('Erro ao obter pedido');
    }
  },

  /**
   * Calcular frete
   * @param {string} cep - CEP de destino
   * @param {number} peso - Peso do pedido em kg
   * @returns {Promise} Opções de frete
   */
  calcularFrete: async (cep, peso) => {
    try {
      return await api.post('/frete/calcular', {
        cep,
        peso
      });
    } catch (error) {
      throw new Error('Erro ao calcular frete');
    }
  },

  /**
   * Validar cupom de desconto
   * @param {string} codigo - Código do cupom
   * @param {number} total - Total do pedido
   * @returns {Promise} Dados do desconto
   */
  validarCupom: async (codigo, total) => {
    try {
      return await api.post('/cupons/validar', {
        codigo,
        total
      });
    } catch (error) {
      throw new Error('Cupom inválido ou expirado');
    }
  },

  /**
   * Processar pagamento
   * @param {Object} dados - Dados do pagamento
   * @returns {Promise} Confirmação do pagamento
   */
  processarPagamento: async (dados) => {
    try {
      return await api.post('/pagamentos/processar', {
        pedidoId: dados.pedidoId,
        metodo: dados.metodo,
        cartao: dados.cartao,
        parcelas: dados.parcelas
      });
    } catch (error) {
      throw new Error(error.message || 'Erro ao processar pagamento');
    }
  },

  /**
   * Cancelar pedido
   * @param {number} pedidoId - ID do pedido
   * @returns {Promise} Confirmação
   */
  cancelarPedido: async (pedidoId) => {
    try {
      return await api.post(`/pedidos/${pedidoId}/cancelar`);
    } catch (error) {
      throw new Error('Erro ao cancelar pedido');
    }
  },

  /**
   * Rastrear pedido
   * @param {number} pedidoId - ID do pedido
   * @returns {Promise} Informações de rastreamento
   */
  rastrearPedido: async (pedidoId) => {
    try {
      return await api.get(`/pedidos/${pedidoId}/rastreamento`);
    } catch (error) {
      throw new Error('Erro ao rastrear pedido');
    }
  }
};

export default cartService;