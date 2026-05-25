import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

/**
 * Hook customizado para gerenciar o carrinho
 * @returns {Object} Objeto com métodos e dados do carrinho
 */
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider');
  }

  const {
    carrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    calcularTotal,
    calcularQuantidadeTotal
  } = context;

  return {
    carrinho,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    calcularTotal,
    calcularQuantidadeTotal,
    // Métodos auxiliares
    estaVazio: () => carrinho.length === 0,
    temItens: () => carrinho.length > 0,
    quantidadeTotal: calcularQuantidadeTotal(),
    total: calcularTotal(),
    itemCount: carrinho.length
  };
}