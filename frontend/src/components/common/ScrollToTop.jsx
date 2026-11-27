import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ao trocar de página, volta para o topo (sem isso, a página nova abre no meio).
// Links com # (ex.: /#sobre) continuam descendo até a parte certa.
export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}
