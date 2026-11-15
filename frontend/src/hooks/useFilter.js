import { useContext } from "react";
import { FilterContext } from "../context/FilterContext";

/**
 * Hook customizado para gerenciar filtros
 * @returns {Object} Objeto com métodos e dados de filtros
 */
export function useFilter() {
  const context = useContext(FilterContext);

  if (!context) {
    throw new Error("useFilter deve ser usado dentro de FilterProvider");
  }

  const {
    filtros,
    atualizarFiltro,
    atualizarFiltros,
    limparFiltros,
    temFiltrosAtivos,
  } = context;

  return {
    filtros,
    atualizarFiltro,
    atualizarFiltros,
    limparFiltros,
    temFiltrosAtivos,
    // Métodos auxiliares
    busca: filtros.busca,
    categoria: filtros.categoria,
    precoMin: filtros.precoMin,
    precoMax: filtros.precoMax,
    ordenacao: filtros.ordenacao,
    setBusca: (valor) => atualizarFiltro("busca", valor),
    setCategoria: (valor) => atualizarFiltro("categoria", valor),
    setPrecoMin: (valor) => atualizarFiltro("precoMin", valor),
    setPrecoMax: (valor) => atualizarFiltro("precoMax", valor),
    setOrdenacao: (valor) => atualizarFiltro("ordenacao", valor),
  };
}
