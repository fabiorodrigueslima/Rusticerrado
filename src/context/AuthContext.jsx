import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const usuarioSalvo = localStorage.getItem('rusticerrado_user');
        const tokenSalvo = localStorage.getItem('rusticerrado_token');

        if (usuarioSalvo && tokenSalvo) {
            try {
                setUser(JSON.parse(usuarioSalvo));
                setToken(tokenSalvo);
            } catch (error) {
                console.error('Erro ao carregar usuário:', error);
                localStorage.removeItem('rusticerrado_user');
                localStorage.removeItem('rusticerrado_token');
            }
        }

        setLoading(false);
    }, []);

    const login = (userData, authToken) => {
        if (!authToken) {
            throw new Error('Token de autenticação ausente');
        }

        setUser(userData);
        setToken(authToken);
        localStorage.setItem('rusticerrado_user', JSON.stringify(userData));
        localStorage.setItem('rusticerrado_token', authToken);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('rusticerrado_user');
        localStorage.removeItem('rusticerrado_token');
    };

    const atualizarUsuario = (novosDados) => {
        const usuarioAtualizado = { ...user, ...novosDados };
        setUser(usuarioAtualizado);
        localStorage.setItem('rusticerrado_user', JSON.stringify(usuarioAtualizado));
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        atualizarUsuario
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
