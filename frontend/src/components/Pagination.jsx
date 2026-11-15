import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange
}) {
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            pages.push(1);
            if (startPage > 2) pages.push('...');
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }

        return pages;
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="pagination">
            <button
                className="pagination-btn"
                onClick={handlePrevious}
                disabled={currentPage === 1}
                aria-label="Página anterior"
            >
                <FaChevronLeft /> Anterior
            </button>

            <div className="pagination-numbers">
                {pageNumbers.map((page, index) => (
                    page === '...' ? (
                        <span key={`dots-${index}`} className="pagination-dots">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                            onClick={() => onPageChange(page)}
                            aria-label={`Página ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    )
                ))}
            </div>

            <button
                className="pagination-btn"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
            >
                Próxima <FaChevronRight />
            </button>
        </div>
    );
}