import { useState } from "react";

/**
 * Hook customizado para gerenciar localStorage
 * @param {string} key - Chave do localStorage
 * @param {*} initialValue - Valor inicial
 * @returns {Array} [valor, setValor, remover]
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage[${key}]:`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao escrever em localStorage[${key}]:`, error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Erro ao remover localStorage[${key}]:`, error);
    }
  };

  return [storedValue, setValue, removeValue];
}
