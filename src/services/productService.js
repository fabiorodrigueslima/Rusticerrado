/**
 * Serviço de Produtos
 * Gerencia listagem, busca, filtros e detalhes de produtos
 */

import { api } from './api';
import { produtos as produtosLocais } from '../data/produtos.json';

const productService = {
  /**
   * Obter todos os produtos
   * @param {Object} filtros - Filtros (busca, categoria, preço, ordenação)
   * @returns {Promise} Lista de produtos
   */
  obterProdutos: async (filtros = {}) => {
    try {
      // Construir query string
      const params = new URLSearchParams();
      if (filtros.busca) params.append('busca', filtros.busca);
      if (filtros.categoria) params.append('categoria', filtros.categoria);
      if (filtros.precoMin) params.append('precoMin', filtros.precoMin);
      if (filtros.precoMax) params.append('precoMax', filtros.precoMax);
      if (filtros.ordenacao) params.append('ordenacao', filtros.ordenacao);
      if (filtros.pagina) params.append('pagina', filtros.pagina);
      if (filtros.limite) params.append('limite', filtros.limite);

      const queryString = params.toString();
      const endpoint = queryString ? `/produtos?${queryString}` : '/produtos';

      return await api.get(endpoint);
    } catch (error) {
      console.warn('Erro ao buscar produtos da API, usando dados locais');
      return { produtos: produtosLocais };
    }
  },

  /**
   * Obter produto por ID
   * @param {number} id - ID do produto
   * @returns {Promise} Dados do produto
   */
  obterProduto: async (id) => {
    try {
      return await api.get(`/produtos/${id}`);
    } catch (error) {
      // Fallback para dados locais
      const produto = produtosLocais.find(p => p.id === parseInt(id));
      if (produto) return produto;
      throw error;
    }
  },

  /**
   * Buscar produtos
   * @param {string} termo - Termo de busca
   * @returns {Promise} Produtos encontrados
   */
  buscar: async (termo) => {
    try {
      return await api.get(`/produtos/busca?termo=${encodeURIComponent(termo)}`);
    } catch (error) {
      // Fallback para busca local
      const resultados = produtosLocais.filter(p =>
        p.nome.toLowerCase().includes(termo.toLowerCase()) ||
        p.descricao.toLowerCase().includes(termo.toLowerCase())
      );
      return { produtos: resultados };
    }
  },

  /**
   * Obter produtos em destaque
   * @returns {Promise} Produtos em destaque
   */
  obterDestaques: async () => {
    try {
      return await api.get('/produtos/destaques');
    } catch (error) {
      // Fallback para dados locais
      const destaques = produtosLocais.filter(p => p.destaque);
      return { produtos: destaques };
    }
  },

  /**
   * Obter produtos novos
   * @returns {Promise} Produtos novos
   */
  obterNovos: async () => {
    try {
      return await api.get('/produtos/novos');
    } catch (error) {
      // Fallback para dados locais
      const novos = produtosLocais.filter(p => p.novo);
      return { produtos: novos };
    }
  },

  /**
   * Obter produtos por categoria
   * @param {string} categoria - Slug da categoria
   * @returns {Promise} Produtos da categoria
   */
  obterPorCategoria: async (categoria) => {
    try {
      return await api.get(`/produtos/categoria/${categoria}`);
    } catch (error) {
      // Fallback para dados locais
      const produtos = produtosLocais.filter(p => p.categoria === categoria);
      return { produtos };
    }
  },

  /**
   * Obter categorias
   * @returns {Promise} Lista de categorias
   */
  obterCategorias: async () => {
    try {
      return await api.get('/categorias');
    } catch (error) {
      console.warn('Erro ao buscar categorias');
      throw error;
    }
  },

  /**
   * Adicionar produto aos favoritos
   * @param {number} produtoId - ID do produto
   * @returns {Promise} Confirmação
   */
  adicionarFavorito: async (produtoId) => {
    try {
      return await api.post('/favoritos', { produtoId });
    } catch (error) {
      throw new Error('Erro ao adicionar aos favoritos');
    }
  },

  /**
   * Remover produto dos favoritos
   * @param {number} produtoId - ID do produto
   * @returns {Promise} Confirmação
   */
  removerFavorito: async (produtoId) => {
    try {
      return await api.delete(`/favoritos/${produtoId}`);
    } catch (error) {
      throw new Error('Erro ao remover dos favoritos');
    }
  },

  /**
   * Obter favoritos do usuário
   * @returns {Promise} Lista de favoritos
   */
  obterFavoritos: async () => {
    try {
      return await api.get('/favoritos');
    } catch (error) {
      throw new Error('Erro ao obter favoritos');
    }
  }
};

export default productService;