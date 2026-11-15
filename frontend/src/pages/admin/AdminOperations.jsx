import { useEffect, useState } from 'react'
import { getAdminResource, mutateAdminResource } from '../../services/lojaApi.js'

const money = (value) => value == null ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
const date = (value) => value ? new Date(value).toLocaleString('pt-BR') : '—'

const incidentLabel = {
  LATE_PAYMENT: 'Pagamento recebido para pedido encerrado ou já pago',
  RESERVATION_EXPIRED: 'Pagamento recebido após a reserva de estoque vencer',
  AMOUNT_MISMATCH: 'Valor pago diferente do total do pedido',
  REFUND: 'Estorno de pedido pago — revisar estoque',
  CHARGEBACK: 'Contestação (chargeback) — revisar',
}
const privacyTypeLabel = { ACCESS: 'Acesso aos dados', CORRECTION: 'Correção', DELETION: 'Exclusão' }
const privacyStatusLabel = { OPEN: 'Recebida', IN_REVIEW: 'Em análise', COMPLETED: 'Concluída', DENIED: 'Negada' }
const privacyNext = { OPEN: ['IN_REVIEW', 'COMPLETED', 'DENIED'], IN_REVIEW: ['COMPLETED', 'DENIED'] }
const orderNext = { PENDING_PAYMENT: ['CANCELLED'], PAID: ['IN_PRODUCTION'], IN_PRODUCTION: ['READY_TO_SHIP'], READY_TO_SHIP: ['SHIPPED'], SHIPPED: ['DELIVERED'] }
const orderStatusLabel = { PENDING_PAYMENT: 'Aguardando pagamento', PAID: 'Pago', IN_PRODUCTION: 'Em produção', READY_TO_SHIP: 'Pronto para envio', SHIPPED: 'Enviado', DELIVERED: 'Entregue', CANCELLED: 'Cancelado', REFUNDED: 'Estornado', CHARGEBACK: 'Contestado' }

function useResource(path, params) {
  const [state, setState] = useState({ data: null, error: '' })
  const [revision, setRevision] = useState(0)
  const key = JSON.stringify(params ?? {})
  useEffect(() => {
    const controller = new AbortController()
    getAdminResource(path, JSON.parse(key), controller.signal).then(({ data }) => setState({ data, error: '' })).catch((error) => { if (error.name !== 'AbortError') setState({ data: null, error: error.message }) })
    return () => controller.abort()
  }, [path, key, revision])
  return [state, () => setRevision((value) => value + 1)]
}

// Small form shared by every action that requires a written justification.
function NoteAction({ label, placeholder, options, onSubmit }) {
  const [note, setNote] = useState('')
  const [choice, setChoice] = useState(options?.[0]?.[0] ?? '')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await onSubmit(note.trim(), choice); setNote('') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <form className="admin-action" onSubmit={submit}>
    {options && <label>Novo status<select value={choice} onChange={(event) => setChoice(event.target.value)}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>}
    <label>{placeholder}<textarea value={note} onChange={(event) => setNote(event.target.value)} minLength="3" maxLength="1000" required /></label>
    <button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : label}</button>
    <p role="status">{message}</p>
  </form>
}

// Marking an order as shipped requires the carrier's tracking code; the customer gets it by e-mail.
function ShipAction({ onSubmit }) {
  const [code, setCode] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('Enviado pelos Correios')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try { await onSubmit({ trackingCode: code.trim().toUpperCase(), trackingUrl: url.trim() || undefined, reason: note.trim() }) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <form className="admin-action" onSubmit={submit}>
    <label>Código de rastreio<input value={code} onChange={(event) => setCode(event.target.value)} pattern="[A-Za-z0-9\-]{4,40}" placeholder="Ex.: AA123456789BR" required /></label>
    <label>Link de rastreio (opcional)<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} pattern="https://.*" maxLength="500" placeholder="https://…" /></label>
    <label>Observação (fica no histórico)<input value={note} onChange={(event) => setNote(event.target.value)} minLength="3" maxLength="240" required /></label>
    <button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Marcar como enviado e avisar a cliente'}</button>
    <p role="status">{message}</p>
  </form>
}

export function PaymentIncidents({ csrfToken }) {
  const [state, reload] = useResource('payment-incidents')
  if (state.error) return <div className="admin-state" role="alert">{state.error}</div>
  if (!state.data) return <div className="admin-state" role="status">Carregando…</div>
  if (!state.data.length) return <div className="admin-state">Nenhuma ocorrência de pagamento.</div>
  return <div className="admin-cards">{state.data.map((item) => <article key={item.id} className={item.status === 'OPEN' ? 'admin-alert' : ''}>
    <h2>{incidentLabel[item.tipo] ?? item.tipo}</h2>
    <p>Pedido {item.codigo_publico} · {item.nome_cliente} ({item.email_cliente})</p>
    <p>{money(item.valor)} · pagamento {item.provedor} nº {item.gateway_payment_id}</p>
    <p>Pedido no momento: {orderStatusLabel[item.status_pedido] ?? item.status_pedido} · agora: {orderStatusLabel[item.pedido_status_atual] ?? item.pedido_status_atual}</p>
    <p>Registrada em {date(item.criado_em)}</p>
    {item.status === 'OPEN'
      ? <NoteAction label="Marcar como resolvida" placeholder="O que foi feito (ex.: estorno no Mercado Pago, envio manual)" onSubmit={async (resolution) => { await mutateAdminResource(`payment-incidents/${item.id}/resolve`, 'POST', { resolution }, csrfToken); reload() }} />
      : <p>Resolvida por {item.resolvido_por ?? '—'} em {date(item.resolvido_em)}: {item.resolucao}</p>}
  </article>)}</div>
}

export function PrivacyRequests({ csrfToken }) {
  const [state, reload] = useResource('privacy-requests')
  if (state.error) return <div className="admin-state" role="alert">{state.error}</div>
  if (!state.data) return <div className="admin-state" role="status">Carregando…</div>
  if (!state.data.length) return <div className="admin-state">Nenhuma solicitação de titular.</div>
  return <><p className="admin-note">Prazo exibido: meta operacional de 15 dias. Confirme com assessoria jurídica os prazos aplicáveis a cada tipo de solicitação.</p>
    <div className="admin-cards">{state.data.map((item) => <article key={item.id} className={item.atrasada ? 'admin-alert' : ''}>
      <h2>{privacyTypeLabel[item.tipo] ?? item.tipo} · {privacyStatusLabel[item.status] ?? item.status}</h2>
      <p>{item.cliente_nome} ({item.cliente_email})</p>
      <p>Aberta em {date(item.criado_em)} · prazo {date(item.prazo_em)}{item.atrasada ? ' · ATRASADA' : ''}</p>
      {item.resposta && <p>Resposta: {item.resposta}</p>}
      <details><summary>Histórico ({item.historico.length})</summary><ul>{item.historico.map((event, index) => <li key={index}>{date(event.criadoEm)} — {privacyStatusLabel[event.statusNovo] ?? event.statusNovo}{event.admin ? ` por ${event.admin}` : ''}{event.nota ? `: ${event.nota}` : ''}</li>)}</ul></details>
      {privacyNext[item.status] && <NoteAction label="Atualizar" placeholder="Registro do atendimento (enviado ao cliente quando concluída ou negada)" options={privacyNext[item.status].map((status) => [status, privacyStatusLabel[status]])} onSubmit={async (note, status) => { await mutateAdminResource(`privacy-requests/${item.id}/status`, 'POST', { status, note }, csrfToken); reload() }} />}
    </article>)}</div></>
}

export function OrderDetail({ id, csrfToken, onChanged }) {
  const [state, reload] = useResource(`orders/${id}`)
  if (state.error) return <p role="alert">{state.error}</p>
  if (!state.data) return <p role="status">Carregando pedido…</p>
  const order = state.data
  const next = orderNext[order.status] ?? []
  return <div className="admin-order-detail">
    <p>{order.nome_cliente} · {order.email_cliente} · {order.telefone_cliente}</p>
    <p>{order.endereco_entrega?.street}, {order.endereco_entrega?.number} — {order.endereco_entrega?.city}/{order.endereco_entrega?.state} · CEP {order.endereco_entrega?.postalCode}</p>
    <ul>{order.items.map((item) => <li key={item.id}>{item.quantidade}× {item.nome_produto} — {item.nome_variante} (SKU {item.sku}) · {money(item.subtotal)}</li>)}</ul>
    <p>Frete {order.frete_metodo ?? '—'}: {money(order.frete)} · Total {money(order.total)}</p>
    <h3>Pagamentos</h3>
    {order.payments.length ? <ul>{order.payments.map((payment) => <li key={payment.id}>{payment.status} · {payment.metodo} · {money(payment.valor)} · {payment.gateway_payment_id ?? 'sem ID do provedor'}</li>)}</ul> : <p>Nenhuma tentativa de pagamento.</p>}
    {order.incidents.some((incident) => incident.status === 'OPEN') && <p className="admin-alert" role="alert">Há ocorrência de pagamento aberta para este pedido. Consulte a seção Ocorrências.</p>}
    <h3>Histórico</h3>
    <ul>{order.history.map((entry) => <li key={entry.id}>{date(entry.criado_em)} — {orderStatusLabel[entry.status_novo] ?? entry.status_novo}{entry.motivo ? `: ${entry.motivo}` : ''}</li>)}</ul>
    {order.codigo_rastreio && <p>Rastreio: <strong>{order.codigo_rastreio}</strong>{order.rastreio_url && <> · <a href={order.rastreio_url} target="_blank" rel="noopener noreferrer">acompanhar</a></>} · enviado em {date(order.enviado_em)}</p>}
    {order.status === 'READY_TO_SHIP' && <ShipAction onSubmit={async (body) => { await mutateAdminResource(`orders/${id}/status`, 'POST', { status: 'SHIPPED', ...body }, csrfToken); reload(); onChanged?.() }} />}
    {next.length > 0 && order.status !== 'READY_TO_SHIP' && <NoteAction label="Alterar status" placeholder="Motivo (fica no histórico)" options={next.map((status) => [status, orderStatusLabel[status]])} onSubmit={async (reason, status) => { await mutateAdminResource(`orders/${id}/status`, 'POST', { status, reason }, csrfToken); reload(); onChanged?.() }} />}
  </div>
}

export function StockAdjust({ variantId, csrfToken, onChanged }) {
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [message, setMessage] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    try { const { data } = await mutateAdminResource(`stock/${variantId}/adjust`, 'POST', { delta: Number(delta), reason: reason.trim() }, csrfToken); setMessage(`Estoque físico agora: ${data.stock} (disponível ${data.available}).`); setDelta(''); setReason(''); onChanged?.() } catch (error) { setMessage(error.message) }
  }
  return <form className="admin-action" onSubmit={submit}>
    <label>Ajuste (+ entrada, − saída)<input type="number" step="1" value={delta} onChange={(event) => setDelta(event.target.value)} required /></label>
    <label>Motivo<input value={reason} onChange={(event) => setReason(event.target.value)} minLength="3" maxLength="240" required /></label>
    <button className="button button-ghost">Ajustar</button>
    <p role="status">{message}</p>
  </form>
}
