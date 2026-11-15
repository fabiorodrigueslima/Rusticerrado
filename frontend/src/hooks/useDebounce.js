import { useState, useEffect } from "react";

/**
 * Hook customizado para debounce
 * Útil para busca, filtros, etc
 * @param {*} value - Valor a fazer debounce
 * @param {number} delay - Delay em ms (padrão: 500)
 * @returns {*} Valor com debounce
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
