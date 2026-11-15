import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { PageMeta } from '../../components/common/PageMeta.jsx'
import { useCustomerAuth } from '../../context/customerAuthContext.jsx'
import { customerOrder, getOrder } from '../../services/lojaApi.js'
import { formatPostalCode, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from './orderModel.js'

const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))

export function OrderPage() {
  const { code } = useParams()
  const { state } = useLocation()
  let accessToken = state?.accessToken
  try { accessToken ||= sessionStorage.getItem(`rusticerrado:order:${code}`) } catch { /* A página continuará protegida se o storage estiver indisponível. */ }
  const { user, loading: authLoading } = useCustomerAuth()
  const [result, setResult] = useState({ data: null, error: '' })

  // Prefer the token from this tab; otherwise (other device, closed tab, rotated
  // token) the signed-in owner can still open the order through their account.
  useEffect(() => {
    if (!accessToken && (authLoading || !user)) return
    const controller = new AbortController()
    const fromAccount = () => customerOrder(code, controller.signal)
    const load = accessToken
      ? getOrder(code, accessToken, controller.signal).catch((error) => { if (user && [401, 404].includes(error.status)) return fromAccount(); throw error })
      : fromAccount()
    load.then((response) => setResult({ data: response.data, error: '' })).catch((error) => { if (error.name !== 'AbortError') setResult({ data: null, error: error.message }) })
    return () => controller.abort()
  }, [accessToken, code, user, authLoading])

  if (!accessToken && !authLoading && !user) return <section className="catalog-state product-state container"><PageMeta title="Pedido protegido" description="Consulta protegida de pedido." noindex /><h1>Acesso protegido</h1><p>Entre na sua conta para acompanhar este pedido. Por segurança, o endereço da página não dá acesso ao pedido sozinho.</p><Link className="button button-primary" to={`/login?next=${encodeURIComponent(`/pedido/${code}`)}`}>Entrar na conta</Link></section>
  if (result.error) return <section className="catalog-state catalog-error product-state container"><PageMeta title="Pedido indisponível" description="Não foi possível consultar este pedido." noindex /><h1>Não foi possível consultar o pedido.</h1><p>{result.error}</p></section>
  if (!result.data) return <div className="catalog-state product-state" role="status" aria-live="polite"><span className="loader" aria-hidden="true" />Consultando pedido…</div>
  const order = result.data
  return <article className="order-page container"><PageMeta title={`Pedido ${order.codigo_publico}`} description="Acompanhe o estado do pedido." noindex /><p className="eyebrow">Pedido protegido</p><h1>{order.codigo_publico}</h1><p>Criado em {new Date(order.criado_em).toLocaleString('pt-BR')}</p><p className="order-status" role="status">{orderStatusLabel[order.status] || order.status}</p><p>Pagamento: {paymentStatusLabel[order.pagamento_status] || 'aguardando início'}{order.metodo ? ` · ${paymentMethodLabel[order.metodo] ?? order.metodo}` : ''}</p><div className="order-items">{order.items.map((item, index) => <div key={`${item.nome_produto}-${index}`}><span>{item.quantidade}× {item.nome_produto} — {item.nome_variante}</span><strong>{money(item.subtotal)}</strong></div>)}</div><dl className="order-totals"><div><dt>Subtotal</dt><dd>{money(order.subtotal)}</dd></div><div><dt>{order.frete_metodo || 'Entrega'}</dt><dd>{money(order.frete)}</dd></div><div><dt>Total</dt><dd>{money(order.total)}</dd></div></dl>{order.endereco_entrega&&<section><h2>Entrega</h2><p>{order.endereco_entrega.street}, {order.endereco_entrega.number}<br/>{order.endereco_entrega.neighborhood}, {order.endereco_entrega.city}/{order.endereco_entrega.state}<br/>CEP {formatPostalCode(order.endereco_entrega.postalCode)}</p>{order.frete_prazo_dias!=null&&<p>Prazo estimado: {order.frete_prazo_dias} dias.</p>}</section>}{order.codigo_rastreio && <section className="order-tracking"><h2>Rastreio</h2><p>Enviado em {new Date(order.enviado_em).toLocaleDateString('pt-BR')}. Código: <strong>{order.codigo_rastreio}</strong></p>{order.rastreio_url ? <a className="button button-primary" href={order.rastreio_url} target="_blank" rel="noopener noreferrer">Acompanhar entrega</a> : <p>Acompanhe no site dos Correios: <a href="https://rastreamento.correios.com.br/app/index.php" target="_blank" rel="noopener noreferrer">rastreamento.correios.com.br</a>.</p>}</section>}{order.status === 'PENDING_PAYMENT' && <p>O pagamento ainda não foi confirmado pelo provedor. Esta página não confirma pagamentos por conta própria.</p>}</article>
}
