import { Link } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';

export default function NotFound() {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <FaExclamationTriangle className="not-found-icon" />
                <h1>404</h1>
                <h2>Página não encontrada</h2>
                <p>Desculpe, a página que você está procurando não existe.</p>
                <Link to="/" className="btn btn-primary">
                    Voltar para Home
                </Link>
            </div>
        </div>
    );
}