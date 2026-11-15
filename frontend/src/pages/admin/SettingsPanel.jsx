import { useEffect, useState } from 'react'
import { getAdminResource, mutateAdminResource } from '../../services/lojaApi.js'

const status = (ok) => ok ? '✅ configurado' : '❌ não configurado'

// Plain-language checklist for the store owner, in the order things have to happen.
function SalesGuide({ open }) {
  return <details className="admin-guide" open={open}>
    <summary>Passo a passo: como ligar as vendas</summary>
    <ol>
      <li><strong>Conecte o Mercado Pago.</strong> Logo abaixo, em “Pagamentos”, clique em “Conectar Mercado Pago” (veja o passo a passo de lá) e escolha as formas de pagamento.</li>
      <li><strong>Mande para o desenvolvedor:</strong> os valores de frete (valor fixo, frete grátis a partir de quanto e se há retirada no ateliê), o endereço completo da loja (aparece nas políticas do site) e o e-mail que vai receber os avisos da loja.</li>
      <li><strong>Cadastre as peças de verdade</strong> em “Produtos”, com foto, preço e estoque, e arquive as peças de demonstração.</li>
      <li><strong>O desenvolvedor tira o site do “modo catálogo”.</strong> Só ele consegue fazer isso, na hospedagem do site.</li>
      <li><strong>Quando a lista “ainda falta” sumir</strong>, o botão “Ligar vendas” fica liberado. Clique nele e confirme.</li>
      <li><strong>Faça uma compra de teste</strong> com valor baixo, pagando com o seu Pix. Confira se o pedido aparece em “Pedidos” e se o e-mail chegou. Depois devolva o dinheiro pelo app do Mercado Pago.</li>
    </ol>
    <p>Precisa parar as vendas (férias, falta de estoque)? Clique em “Desligar vendas”. O catálogo continua no ar e nada é apagado.</p>
  </details>
}

// The store's online-sales switch. The server refuses to turn it on while payment,
// shipping or email are missing, so this screen only explains what is still needed.
export function SettingsPanel({ csrfToken, canEdit }) {
  const [state, setState] = useState({ settings: null, integrations: null, sales: null, error: '' })
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getAdminResource('settings', {}, controller.signal)
      .then(({ data, integrations, sales }) => setState({ settings: Object.fromEntries(data.map((item) => [item.chave, item.valor])), integrations, sales, error: '' }))
      .catch((error) => { if (error.name !== 'AbortError') setState((current) => ({ ...current, error: error.message })) })
    return () => controller.abort()
  }, [revision])

  if (state.error) return <div className="admin-state" role="alert">{state.error}</div>
  if (!state.settings) return <div className="admin-state" role="status">Carregando…</div>

  const enabled = state.settings['checkout.enabled'] === true
  const ready = state.sales?.ready === true
  const missing = state.sales?.missing ?? []
  const change = async (value) => {
    const question = value
      ? 'Ligar as vendas pelo site? As clientes vão poder comprar e pagar pelo Mercado Pago.'
      : 'Desligar as vendas pelo site? O catálogo continua no ar, mas ninguém consegue finalizar compras.'
    if (!window.confirm(question)) return
    setBusy(true); setMessage('')
    try {
      await mutateAdminResource('settings', 'PUT', { checkoutEnabled: value }, csrfToken)
      setMessage(value ? 'Vendas ligadas.' : 'Vendas desligadas.')
      setRevision((current) => current + 1)
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  return <div className="admin-settings">
    <h2>Vendas pelo site</h2>
    <p className={`admin-sales-status ${enabled ? 'on' : 'off'}`}><strong>{enabled ? 'Ligadas' : 'Desligadas'}</strong>{enabled ? ' — as clientes podem comprar pelo site.' : ' — o site mostra as peças, mas não finaliza compras.'}</p>
    {missing.length > 0 && <div className="admin-note">
      <p>{enabled ? 'Atenção: as compras não conseguem ser concluídas porque falta:' : 'Para ligar as vendas, ainda falta:'}</p>
      <ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul>
    </div>}
    {canEdit
      ? enabled
        ? <button type="button" className="button button-ghost admin-danger" disabled={busy} onClick={() => change(false)}>Desligar vendas</button>
        : <button type="button" className="button button-primary" disabled={busy || !ready} onClick={() => change(true)}>Ligar vendas</button>
      : <p className="admin-note">Só a dona da loja pode ligar ou desligar as vendas.</p>}
    <p role="status">{message}</p>
    <SalesGuide open={!enabled} />

    <h2>Integrações</h2>
    <p>Pagamento (Mercado Pago): {status(state.integrations?.payment)}</p>
    <p>Frete: {status(state.integrations?.shipping)}</p>
    <p>E-mails automáticos: {status(state.integrations?.email)}</p>
    <p>Fotos das peças: {status(state.integrations?.imageStorage)}</p>

    <h2>Reserva de estoque</h2>
    <p>Um pedido não pago segura a peça por {state.settings['checkout.reservation_minutes']} minutos. Depois disso, ela volta a ficar disponível.</p>
  </div>
}
