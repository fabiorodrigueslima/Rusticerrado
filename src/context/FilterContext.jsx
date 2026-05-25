import { createContext, useState } from 'react';

export const FilterContext = createContext();

export function FilterProvider({ children }) {
    const [filtros, setFiltros] = useState({
        busca: '',
        categoria: '',
        precoMin: 0,
        precoMax: 1000,
        ordenacao: 'nome'
    });

    // Atualizar um filtro
    const atualizarFiltro = (chave, valor) => {
        setFiltros(prev => ({
            ...prev,
            [chave]: valor
        }));
    };

    // Atualizar múltiplos filtros
    const atualizarFiltros = (novosFiltros) => {
        setFiltros(prev => ({
            ...prev,
            ...novosFiltros
        }));
    };

    // Limpar todos os filtros
    const limparFiltros = () => {
        setFiltros({
            busca: '',
            categoria: '',
            precoMin: 0,
            precoMax: 1000,
            ordenacao: 'nome'
        });
    };

    // Verificar se há filtros ativos
    const temFiltrosAtivos = () => {
        return (
            filtros.busca !== '' ||
            filtros.categoria !== '' ||
            filtros.precoMin > 0 ||
            filtros.precoMax < 1000 ||
            filtros.ordenacao !== 'nome'
        );
    };

    const value = {
        filtros,
        atualizarFiltro,
        atualizarFiltros,
        limparFiltros,
        temFiltrosAtivos
    };

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
}