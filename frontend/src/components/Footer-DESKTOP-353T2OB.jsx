import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaWhatsapp, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import "../styles/style.css"
import logoRusticerrado from '../assets/img/RustiCerrado.oficial.png';
import { contact, formatPhone, whatsappLink } from '../config/contact.js';


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
                            href={contact.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Instagram"
                        >
                            <FaInstagram />
                        </a>
                        <a
                            href={contact.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Facebook"
                        >
                            <FaFacebookF />
                        </a>
                        <a
                            href={whatsappLink()}
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
                        <li><Link to="/privacidade">Privacidade</Link></li>
                        <li><Link to="/termos">Termos de Uso</Link></li>
                        <li><Link to="/trocas-e-devolucoes">Trocas e Devoluções</Link></li>
                    </ul>
                </div>

                {/* COLUNA 3: CONTATO */}
                <div className="footer-col">
                    <h4>Contato</h4>
                    <p>
                        <FaPhone /> {formatPhone()}
                    </p>
                    <p>
                        <FaEnvelope /> rusticerrado@gmail.com
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
