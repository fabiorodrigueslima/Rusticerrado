import { Link } from 'react-router-dom';
import { FaInstagram, FaWhatsapp, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import "../styles/style.css"
import logoRusticerrado from '../assets/img/Rusticerrado.oficial.png';


export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="container footer-content">
                {/* COLUNA 1: LOGO E REDES SOCIAIS */}
                <div className="footer-col">
                    <div className="footer-logo">
                        <img src={logoRusticerrado} alt="RustiCerrado" />
                        <strong>RustiCerrado</strong>
                    </div>
                    <p>
                        Transformando madeira bruta em arte eterna. Inspirado na força e beleza
                        do Cerrado brasileiro.
                    </p>
                    <div className="social-links">
                        <a
                            href="https://www.instagram.com/rusticerrado/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                        >
                            <FaInstagram />
                        </a>
                        <a
                            href="https://wa.me/5561999952341"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="WhatsApp"
                        >
                            <FaWhatsapp />
                        </a>
                    </div>
                </div>

                {/* COLUNA 2: NAVEGAÇÃO */}
                <div className="footer-col">
                    <h4>Navegação</h4>
                    <ul>
                        <li><Link to="/">Início</Link></li>
                        <li><Link to="/loja">Loja</Link></li>
                        <li><Link to="/contato">Contato</Link></li>
                        <li><Link to="/personalizados">Personalizados</Link></li>
                    </ul>
                </div>

                {/* COLUNA 3: CONTATO */}
                <div className="footer-col">
                    <h4>Contato</h4>
                    <p>
                        <FaPhone /> (61) 99995-2341
                    </p>
                    <p>
                        <FaEnvelope /> contato@rusticerrado.com.br
                    </p>
                    <p>
                        <FaMapMarkerAlt /> Brasília - DF
                    </p>
                </div>
            </div>

            {/* FOOTER BOTTOM */}
            <div className="footer-bottom">
                <p>
                    &copy; {currentYear} RustiCerrado · Arte em Madeira e Resina ·
                    Todos os direitos reservados
                </p>
            </div>
        </footer>
    );
}