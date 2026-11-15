import { Link, useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { FaUser, FaUserCog, FaBox, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

export default function UserMenu() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout, loading } = useContext(AuthContext);
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    const fotoUsuario = user?.foto
        ? user.foto.startsWith("data:image")
            ? user.foto
            : user.foto.startsWith("http")
                ? user.foto
                : `http://localhost:5000${user.foto}`
        : defaultAvatar;

    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(prev => !prev);
    };

    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    const handleLogout = async () => {
        await logout();
        closeDropdown();
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (loading) return null;

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
                onClick={toggleDropdown}
                className="user-avatar-btn"
            >
                <img
                    src={fotoUsuario}
                    alt="Perfil"
                    className="user-avatar"
                    onError={(e) => {
                        e.currentTarget.src = defaultAvatar;
                    }}
                />
            </button>

            {isDropdownOpen && (
                <div className="user-dropdown">

                    <div className="dropdown-header">
                        Olá, {user?.nome || 'Usuário'}
                    </div>

                    <Link to="/perfil" onClick={closeDropdown}>
                        <FaUser /> Meu Perfil
                    </Link>

                    <Link to="/minha-conta" onClick={closeDropdown}>
                        <FaUserCog /> Minha Conta
                    </Link>

                    <Link to="/compras" onClick={closeDropdown}>
                        <FaBox /> Minhas Compras
                    </Link>

                    <hr />

                    <button
                        onClick={handleLogout}
                        className="logout-btn"
                    >
                        <FaSignOutAlt /> Sair
                    </button>

                </div>
            )}
        </div>
    );
}