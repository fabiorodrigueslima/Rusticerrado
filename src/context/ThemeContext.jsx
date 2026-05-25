import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Verificar preferência de tema ao montar
    useEffect(() => {
        const temaSalvo = localStorage.getItem('rusticerrado_theme');
        const preferenciaSistema = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (temaSalvo) {
            setIsDarkMode(temaSalvo === 'dark');
        } else {
            setIsDarkMode(preferenciaSistema);
        }
    }, []);

    // Aplicar tema ao documento
    useEffect(() => {
        const html = document.documentElement;
        if (isDarkMode) {
            html.classList.add('dark-mode');
            localStorage.setItem('rusticerrado_theme', 'dark');
        } else {
            html.classList.remove('dark-mode');
            localStorage.setItem('rusticerrado_theme', 'light');
        }
    }, [isDarkMode]);

    // Toggle tema
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    const value = {
        isDarkMode,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}