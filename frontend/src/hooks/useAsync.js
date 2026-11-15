import { useState, useEffect, useCallback } from "react";

/**
 * Hook customizado para operações assíncronas
 * @param {Function} asyncFunction - Função assíncrona a executar
 * @param {boolean} immediate - Executar imediatamente (padrão: true)
 * @returns {Object} Objeto com dados, loading, erro e execute
 */
export function useAsync(asyncFunction, immediate = true) {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setStatus("pending");
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus("success");
      return response;
    } catch (err) {
      setError(err);
      setStatus("error");
      throw err;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    data,
    error,
    // Aliases úteis
    isPending: status === "pending",
    isSuccess: status === "success",
    isError: status === "error",
    isIdle: status === "idle",
  };
}
