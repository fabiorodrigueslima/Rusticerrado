import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Hook customizado para gerenciar tema
 * @returns {Object} Objeto com dados e métodos do tema
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }

  const { isDarkMode, toggleTheme } = context;

  return {
    isDarkMode,
    toggleTheme,
    // Métodos auxiliares
    isLightMode: !isDarkMode,
    tema: isDarkMode ? "dark" : "light",
    mudarParaEscuro: () => (isDarkMode ? null : toggleTheme()),
    mudarParaClaro: () => (isDarkMode ? toggleTheme() : null),
  };
}
