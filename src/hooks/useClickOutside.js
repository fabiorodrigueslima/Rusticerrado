import { useEffect, useRef } from "react";

/**
 * Hook customizado para detectar clique fora de um elemento
 * @param {Function} callback - Função a executar ao clicar fora
 * @returns {Object} Ref para o elemento
 */
export function useClickOutside(callback) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [callback]);

  return ref;
}
