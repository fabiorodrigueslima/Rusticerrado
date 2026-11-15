import { useEffect, useRef } from "react";

/**
 * Hook customizado para acessar valor anterior
 * @param {*} value - Valor atual
 * @returns {*} Valor anterior
 */
export function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
