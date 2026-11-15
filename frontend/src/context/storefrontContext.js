import { createContext, useContext } from 'react';

export const StorefrontContext = createContext({ mode: null, loading: true });
export const useStorefront = () => useContext(StorefrontContext);

// Vendas pelo site ligadas (SITE_MODE=commerce). No modo catálogo, ou enquanto carrega,
// o site esconde carrinho e conta e oferece o pedido pelo WhatsApp.
export const useOnlineSales = () => useStorefront().mode === 'commerce';
