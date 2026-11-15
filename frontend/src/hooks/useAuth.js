import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * Hook customizado para gerenciar autenticação
 * @returns {Object} Objeto com métodos e dados de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  const {
    user,
    token,
    loading,
    login,
    logout,
    atualizarUsuario,
    isAuthenticated,
  } = context;

  return {
    user,
    token,
    loading,
    login,
    logout,
    atualizarUsuario,
    isAuthenticated,
    // Métodos auxiliares
    estaLogado: isAuthenticated(),
    nomeUsuario: user?.nome || "",
    emailUsuario: user?.email || "",
    temFoto: user?.foto ? true : false,
  };
}
