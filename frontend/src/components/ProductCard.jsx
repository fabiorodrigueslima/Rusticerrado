import { Link } from 'react-router-dom';
import { FaWhatsapp } from 'react-icons/fa';
import { formatarPreco } from '../services/catalogo';

export default function ProductCard({ produto }) {
    return (
        <div className="product-card">
            <div className="product-image-wrapper">
                <img src={produto.imagem} alt={produto.imagemAlt ?? produto.nome} loading="lazy" />
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
                        {produto.precoOriginal && <s className="produto-preco-original">{formatarPreco(produto.precoOriginal)}</s>}{' '}
                        {formatarPreco(produto.preco)}
                    </span>
                    <a
                        href={`https://wa.me/5561999952341?text=${encodeURIComponent(`Olá! Tenho interesse no produto: ${produto.nome}`)}`}
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
