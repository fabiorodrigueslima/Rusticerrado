import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';

export default function ProductCard({ produto }) {
    return (
        <div className="product-card">
            <div className="product-image-wrapper">
                <img src={produto.imagem} alt={produto.nome} />
                <div className="produto-overlay">
                    <Link to={`/produto/${produto.id}`} className="btn-ver">
                        Ver Detalhes
                    </Link>
                </div>
            </div>

            <div className="produto-info">
                <h3>{produto.nome}</h3>
                <p className="produto-descricao">{produto.descricao}</p>

                <div className="produto-footer">
                    <span className="produto-preco">
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <a
                        href={`https://wa.me/5561999952341?text=Olá! Tenho interesse no produto: ${produto.nome}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whats"
                        aria-label="Enviar mensagem no WhatsApp"
                    >
                        <FaWhatsapp />
                    </a>
                </div>
            </div>
        </div>
    );
}
