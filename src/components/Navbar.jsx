import { Link } from 'react-router-dom';
import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import UserMenu from './UserMenu';
import CartIcon from './CartIcon';
import "../styles/style.css"
import logoRusticerrado from '../assets/img/RustiCerrado.oficial.png';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <header className="main-header">
            <div className="container header-container">
                {/* LOGO */}
                <Link to="/" className="logo" onClick={closeMenu}>
                    <img src={logoRusticerrado} alt="RustiCerrado" />
                    <span className="logo-text">RustiCerrado</span>
                </Link>


                {/* NAVEGAÇÃO PRINCIPAL */}
                <nav className={`main-nav ${isMenuOpen ? 'active' : ''}`}>
                    <Link
                        to="/"
                        className="nav-link"
                        onClick={closeMenu}
                    >
                        Início
                    </Link>
                    <Link
                        to="/loja"
                        className="nav-link"
                        onClick={closeMenu}
                    >
                        Loja
                    </Link>
                    <Link
                        to="/contato"
                        className="nav-link"
                        onClick={closeMenu}
                    >
                        Contato
                    </Link>
                </nav>

                {/* AÇÕES DO HEADER */}
                <div className="header-actions">
                    {/* ÍCONE DO CARRINHO */}
                    <CartIcon />

                    {/* MENU DO USUÁRIO */}
                    <UserMenu />

                    {/* WHATSAPP */}
                    <a
                        href="https://wa.me/5561999952341"
                        className="header-whatsapp"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="WhatsApp"
                    >
                        <FaWhatsapp />
                    </a>

                    {/* HAMBURGER MENU (MOBILE) */}
                    <button
                        className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                        aria-label="Menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </header>
    );
}
