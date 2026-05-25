import { Link } from 'react-router-dom';
import { FaLeaf } from 'react-icons/fa';
import "../styles/style.css"
import logoRusticerrado from '../assets/img/Rusticerrado.oficial.png';

export default function Hero() {
    return (
        <section className="hero">
            <div className="hero-overlay"></div>
            <div className="container hero-container">
                <div className="hero-content animate-on-scroll">
                    <div className="hero-badge">
                        <FaLeaf />
                        <span>100% Artesanal</span>
                    </div>

                    <h1>
                        Arte em Madeira <span className="highlight">&amp; Resina</span>
                    </h1>

                    <p className="hero-subtitle">
                        Peças exclusivas e únicas, feitas à mão com madeira natural do Cerrado
                        e resina de alta qualidade. Cada criação conta uma história.
                    </p>

                    <div className="hero-buttons">
                        <Link to="/loja" className="btn btn-primary">
                            Ver Produtos
                        </Link>
                        <a href="#sobre" className="btn btn-outline">
                            Nossa História
                        </a>
                    </div>
                </div>

                <div className="hero-image animate-on-scroll">
                  <img src={logoRusticerrado} alt="RustiCerrado" />
                </div>
            </div>
        </section>
    );
}