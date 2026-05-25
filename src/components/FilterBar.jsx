import { FaSearch, FaTimes } from 'react-icons/fa';

export default function FilterBar({
    searchValue,
    onSearchChange,
    sortValue,
    onSortChange,
    onClearFilters,
    hasActiveFilters = false
}) {
    return (
        <div className="filter-bar">
            <div className="filter-search">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchValue}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="filter-sort">
                <label htmlFor="sort-select">Ordenar por:</label>
                <select
                    id="sort-select"
                    value={sortValue}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="sort-select"
                >
                    <option value="nome">Nome (A-Z)</option>
                    <option value="preco-asc">Preço (Menor para Maior)</option>
                    <option value="preco-desc">Preço (Maior para Menor)</option>
                    <option value="novo">Mais Novo</option>
                </select>
            </div>

            {hasActiveFilters && (
                <button
                    className="btn-clear-filters"
                    onClick={onClearFilters}
                    aria-label="Limpar filtros"
                >
                    <FaTimes /> Limpar Filtros
                </button>
            )}
        </div>
    );
}