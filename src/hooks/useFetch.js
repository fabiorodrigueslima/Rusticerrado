import { useState, useEffect, useCallback } from "react";

/**
 * Hook customizado para fazer requisições HTTP
 * @param {string} url - URL para fazer a requisição
 * @param {Object} options - Opções da requisição (headers, method, etc)
 * @returns {Object} Objeto com dados, loading, erro e refetch
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = () => {
    fetchData();
  };

  return {
    data,
    loading,
    error,
    refetch,
    temDados: data !== null,
    temErro: error !== null,
  };
}
