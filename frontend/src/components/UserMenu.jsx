import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { FaBox, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { useCustomerAuth } from '../context/customerAuthContext.jsx';
import { useOnlineSales } from '../context/storefrontContext.js';

// Menu da conta do cliente (sessão por cookie seguro, igual ao Brinco de Princesa).
export default function UserMenu() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, loading, signOut } = useCustomerAuth();
    const vendeOnline = useOnlineSales();
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const nome = user?.name ?? user?.nome ?? '';
    const closeDropdown = () => setIsDropdownOpen(false);

    const handleLogout = async () => {
        try {
            await signOut();
        } finally {
            closeDropdown();
            navigate('/');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Contas de cliente só existem com as vendas ligadas.
    if (loading || !vendeOnline) return null;

    if (!user) {
        return (
            <div className="auth-links">
                <Link to="/login">Entrar</Link>
                <Link to="/cadastro">Cadastrar</Link>
            </div>
        );
    }

    return (
        <div className="user-menu-container" ref={menuRef}>
            <button
                type="button"
                onClick={(event) => { event.stopPropagation(); setIsDropdownOpen((open) => !open); }}
                className="user-avatar-btn"
                aria-label="Minha conta"
                aria-expanded={isDropdownOpen}
            >
                <FaUserCircle className="user-avatar" aria-hidden="true" />
            </button>

            {isDropdownOpen && (
                <div className="user-dropdown">
                    <div className="dropdown-header">Olá, {nome.split(' ')[0] || 'cliente'}</div>
                    <Link to="/minha-conta" onClick={closeDropdown}>
                        <FaBox /> Minha conta e pedidos
                    </Link>
                    <hr />
                    <button onClick={handleLogout} className="logout-btn">
                        <FaSignOutAlt /> Sair
                    </button>
                </div>
            )}
        </div>
    );
}
