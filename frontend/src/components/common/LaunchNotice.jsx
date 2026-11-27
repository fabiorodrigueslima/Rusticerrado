import { FaWhatsapp } from 'react-icons/fa';
import { whatsappLink } from '../../config/contact.js';
import { useStorefront } from '../../context/storefrontContext.js';

// Aviso que aparece enquanto as vendas pelo site estão desligadas (modo catálogo).
// Some sozinho quando a loja ligar as vendas.
export function LaunchNotice() {
  const { mode, loading } = useStorefront();
  if (loading || mode === 'commerce') return null;

  return (
    <aside className="launch-notice" aria-label="Compras pelo site em breve">
      <div>
        <p className="section-tag">Compras pelo site em breve</p>
        <p>
          Por enquanto, as encomendas são feitas pelo WhatsApp. Escolha a peça que você gostou
          e fale com a gente.
        </p>
      </div>
      <a
        className="btn btn-primary"
        href={whatsappLink('Olá, RustiCerrado! Vim pelo site e quero encomendar uma peça.')}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaWhatsapp /> Quero uma peça
      </a>
    </aside>
  );
}
