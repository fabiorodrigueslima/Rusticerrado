import { useEffect, useState } from 'react'
import { getAdminResource, mutateAdminResource } from '../../services/lojaApi.js'

const returnMessages = {
  conectado: 'Conta do Mercado Pago conectada com sucesso.',
  cancelado: 'A conexão foi cancelada no Mercado Pago. Nada mudou.',
  erro: 'Não foi possível conectar. Tente de novo; se continuar, avise o desenvolvedor.',
}
const methodLabels = [
  ['pix', 'Pix', 'Aprovado na hora. É a forma com a menor taxa.'],
  ['credit', 'Cartão de crédito', 'Aprovado na hora, à vista ou parcelado.'],
  ['debit', 'Cartão de débito', 'Aprovado na hora.'],
  ['boleto', 'Boleto', 'Compensa em 1 a 3 dias úteis. A peça fica reservada até o vencimento (3 dias) e mais o prazo do banco.'],
]
const date = (value) => (value ? new Date(value).toLocaleDateString('pt-BR') : '—')

// Plain-language guide for connecting the store owner's own Mercado Pago account.
function ConnectGuide({ open }) {
  return <details className="admin-guide" open={open}>
    <summary>Passo a passo: como conectar o Mercado Pago</summary>
    <ol>
      <li><strong>Antes de tudo:</strong> neste mesmo navegador, abra <strong>mercadopago.com.br</strong> e confira que está entrando na <strong>sua</strong> conta, a que vai receber o dinheiro das vendas. Se outra conta estiver aberta, saia dela primeiro.</li>
      <li>Volte para esta tela e clique em <strong>“Conectar Mercado Pago”</strong>.</li>
      <li>O Mercado Pago abre e pergunta se você autoriza a loja. Confira o nome da conta e clique em <strong>“Autorizar”</strong> (ou “Permitir”).</li>
      <li>Você volta para cá sozinha e aparece <strong>“Mercado Pago conectado”</strong>.</li>
      <li>Em “Formas de pagamento aceitas”, marque <strong>Pix, cartão de crédito, cartão de débito e boleto</strong> (as que quiser), escolha as parcelas e clique em <strong>“Salvar formas de pagamento”</strong>.</li>
    </ol>
    <p>O dinheiro das vendas cai direto na sua conta do Mercado Pago. Nenhuma senha fica guardada no site. A autorização vale 6 meses e é renovada sozinha; se aparecer um aviso de vencimento, é só clicar em “Conectar de novo”. Nunca passe a senha do Mercado Pago para ninguém, nem para o desenvolvedor.</p>
  </details>
}

// "Pagamentos": the store owner connects her own Mercado Pago account and chooses how
// customers can pay. No credential is typed or copied here.
export function PaymentsPanel({ csrfToken }) {
  const [state, setState] = useState({ data: null, error: '' })
  const [methods, setMethods] = useState(null)
  const [revision, setRevision] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(() => {
    const result = new URLSearchParams(window.location.search).get('pagamentos')
    return returnMessages[result] ?? ''
  })

  useEffect(() => {
    // The ?pagamentos= notice from the Mercado Pago return is shown once, then removed from the address.
    if (new URLSearchParams(window.location.search).has('pagamentos')) window.history.replaceState(null, '', window.location.pathname)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getAdminResource('payments', {}, controller.signal)
      .then(({ data }) => {
        const expiresSoon = data.connection.connected && new Date(data.connection.expiresAt).getTime() - Date.now() < 15 * 86400000
        setState({ data, expiresSoon, error: '' }); setMethods(data.methods)
      })
      .catch((error) => { if (error.name !== 'AbortError') setState({ data: null, error: error.message }) })
    return () => controller.abort()
  }, [revision])

  if (state.error) return <div className="admin-state" role="alert">{state.error}</div>
  if (!state.data || !methods) return <div className="admin-state" role="status">Carregando pagamentos…</div>
  const { connection } = state.data

  const run = async (work) => { setBusy(true); setMessage(''); try { await work() } catch (error) { setMessage(error.message) } finally { setBusy(false) } }
  const connect = () => run(async () => {
    const { data } = await mutateAdminResource('payments/mercado-pago/connect', 'POST', {}, csrfToken)
    window.location.assign(data.authorizationUrl)
  })
  const disconnect = () => {
    if (!window.confirm('Desconectar a conta do Mercado Pago? As clientes não vão conseguir pagar até você conectar de novo.')) return
    run(async () => { await mutateAdminResource('payments/mercado-pago', 'DELETE', undefined, csrfToken); setMessage('Conta desconectada.'); setRevision((value) => value + 1) })
  }
  const save = (event) => {
    event.preventDefault()
    if (!methods.pix && !methods.credit && !methods.debit && !methods.boleto) { setMessage('Deixe pelo menos uma forma de pagamento ligada.'); return }
    run(async () => { const { data } = await mutateAdminResource('payments/methods', 'PUT', methods, csrfToken); setMethods(data); setMessage('Formas de pagamento salvas.') })
  }
  const { expiresSoon } = state

  return <section className="admin-settings admin-payments">
    <h2>Pagamentos</h2>
    {connection.appConfigured && <ConnectGuide open={!connection.connected} />}
    {!connection.appConfigured
      ? <p className="admin-note">A conexão com o Mercado Pago ainda não foi preparada pelo desenvolvedor do site.</p>
      : connection.connected
        ? <>
          <p className="admin-sales-status on"><strong>Mercado Pago conectado</strong> — conta nº {connection.accountId}{connection.liveMode ? '' : ' (modo de teste)'}. Conectado em {date(connection.connectedAt)}.</p>
          {expiresSoon && <p className="admin-alert" role="alert">A autorização vence em {date(connection.expiresAt)}. Clique em “Conectar de novo” para renovar.</p>}
          <div className="button-row">
            <button type="button" className="button button-ghost" disabled={busy} onClick={connect}>Conectar de novo</button>
            <button type="button" className="button button-ghost admin-danger" disabled={busy} onClick={disconnect}>Desconectar</button>
          </div>
          <p className="admin-note">O dinheiro das vendas cai na sua conta do Mercado Pago. Para escolher o banco do saque, use o app do Mercado Pago.</p>
        </>
        : <>
          <p className="admin-sales-status off"><strong>Mercado Pago não conectado.</strong></p>
          <p>Clique no botão, entre na <strong>sua</strong> conta do Mercado Pago e toque em <strong>Autorizar</strong>. Você volta para cá sozinha. Nenhuma senha é guardada pelo site.</p>
          <button type="button" className="button button-primary" disabled={busy} onClick={connect}>Conectar Mercado Pago</button>
        </>}

    <form className="admin-action" onSubmit={save}>
      <h3>Formas de pagamento aceitas</h3>
      {methodLabels.map(([key, label, hint]) => <label key={key} className="admin-check">
        <input type="checkbox" checked={methods[key]} onChange={(event) => setMethods({ ...methods, [key]: event.target.checked })} />
        <span><strong>{label}</strong><small>{hint}</small></span>
      </label>)}
      {methods.credit && <label>Parcelas no cartão de crédito (máximo)
        <select value={methods.maxInstallments} onChange={(event) => setMethods({ ...methods, maxInstallments: Number(event.target.value) })}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value === 1 ? 'Só à vista' : `Até ${value}x`}</option>)}
        </select>
      </label>}
      <button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar formas de pagamento'}</button>
    </form>
    <p role="status">{message}</p>
  </section>
}
