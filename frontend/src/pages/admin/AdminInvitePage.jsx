import '../../styles/admin.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../components/common/PageMeta.jsx'
import { acceptAdminInvite, inspectAdminInvite } from '../../services/lojaApi.js'
import { PasswordInput } from '../../components/common/PasswordInput.jsx'

const roleLabel = { OWNER: 'Dona/Dono (acesso completo)', MANAGER: 'Gerente', FULFILLMENT: 'Expedição (estoque e pedidos)' }

// The token travels in the URL fragment (#...), which browsers never send to servers or logs.
const readToken = () => window.location.hash.replace(/^#/, '')
const validToken = (token) => /^[A-Za-z0-9_-]{43}$/.test(token)
const incompleteLink = { loading: false, invite: null, error: 'Este link de convite está incompleto. Abra o link exatamente como foi enviado.' }

export function AdminInvitePage() {
  const [token] = useState(readToken)
  const [state, setState] = useState(() => validToken(token) ? { loading: true, invite: null, error: '' } : incompleteLink)
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!validToken(token)) return
    const controller = new AbortController()
    inspectAdminInvite(token, controller.signal)
      .then(({ data }) => setState({ loading: false, invite: data, error: '' }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ loading: false, invite: null, error: error.message }) })
    return () => controller.abort()
  }, [token])

  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    if (form.password.length < 10) { setMessage('A senha precisa ter pelo menos 10 caracteres.'); return }
    if (form.password !== form.confirm) { setMessage('As duas senhas não são iguais.'); return }
    setBusy(true)
    try { await acceptAdminInvite(token, form.password); setDone(true); window.history.replaceState(null, '', window.location.pathname) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  const card = (content) => <main className="admin-login"><PageMeta title="Convite para o painel" description="Crie seu acesso ao painel da RustiCerrado." noindex /><form onSubmit={submit}>{content}</form></main>

  if (state.loading) return card(<p role="status">Verificando o convite…</p>)
  if (state.error) return card(<><p className="eyebrow">Convite</p><h1>Link indisponível</h1><p className="admin-message" role="alert">{state.error}</p><p>Peça a quem enviou o convite para gerar um novo link.</p></>)
  if (done) return card(<><p className="eyebrow">Tudo certo</p><h1>Acesso criado!</h1><p>Agora entre no painel com o e-mail <strong>{state.invite.email}</strong> e a senha que você acabou de criar.</p><Link className="button button-primary" to="/admin">Ir para o painel</Link></>)
  return card(<>
    <p className="eyebrow">Convite para o painel</p>
    <h1>Olá, {state.invite.name.split(' ')[0]}!</h1>
    <p>Você foi convidada(o) para administrar a loja RustiCerrado como <strong>{roleLabel[state.invite.role] ?? state.invite.role}</strong>. Crie a sua senha para entrar.</p>
    <label>E-mail<input type="email" value={state.invite.email} autoComplete="username" readOnly /></label>
    <label>Crie uma senha<PasswordInput autoComplete="new-password" minLength="10" maxLength="200" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><small>Pelo menos 10 caracteres. Uma frase fácil de lembrar funciona bem.</small></label>
    <label>Repita a senha<PasswordInput autoComplete="new-password" minLength="10" maxLength="200" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} required /></label>
    <p className="admin-message" role="alert">{message}</p>
    <button className="button button-primary" disabled={busy}>{busy ? 'Criando acesso…' : 'Criar meu acesso'}</button>
  </>)
}
