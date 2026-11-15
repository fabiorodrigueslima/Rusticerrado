import '../../styles/admin.css'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageMeta } from '../../components/common/PageMeta.jsx'
import { requestAdminPasswordReset, resetAdminPassword } from '../../services/lojaApi.js'
import { TurnstileWidget } from '../../components/common/TurnstileWidget.jsx'
import { useHumanCheck } from '../../context/useHumanCheck.js'

// The token travels in the URL fragment (#...), which browsers never send to servers or logs.
const readToken = () => window.location.hash.replace(/^#/, '')
const validToken = (token) => /^[A-Za-z0-9_-]{43}$/.test(token)

const card = (title, content, onSubmit) => <main className="admin-login"><PageMeta title={title} description="Recuperação de acesso ao painel da RustiCerrado." noindex /><form onSubmit={onSubmit}>{content}</form></main>

// "Esqueci a senha": asks for the e-mail and always shows the same answer, whether or not
// the address belongs to an administrator.
export function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const human = useHumanCheck('admin-forgot')
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    if (!human.ready) { setMessage('Confirme que você não é um robô.'); return }
    setBusy(true)
    try { await requestAdminPasswordReset(email.trim(), undefined, human.token); setSent(true) } catch (error) { setMessage(error.message) } finally { setBusy(false); human.reset() }
  }
  if (sent) return card('Verifique seu e-mail', <><p className="eyebrow">Recuperar acesso</p><h1>Verifique seu e-mail</h1><p>Se <strong>{email}</strong> for um acesso do painel, você vai receber em instantes um link para criar uma senha nova. O link vale por 30 minutos e funciona uma vez só.</p><p>Não chegou? Veja a caixa de spam ou peça de novo daqui a alguns minutos.</p><Link className="button button-primary" to="/admin">Voltar para o login</Link></>)
  return card('Esqueci a senha', <>
    <p className="eyebrow">Recuperar acesso</p>
    <h1>Esqueci a senha</h1>
    <p>Digite o e-mail do seu acesso ao painel. Vamos enviar um link para você criar uma senha nova.</p>
    <label>E-mail<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
    <TurnstileWidget {...human.widget} />
    <p className="admin-message" role="alert">{message}</p>
    <button className="button button-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar link'}</button>
    <p><Link to="/admin">Voltar para o login</Link></p>
  </>, submit)
}

// Opened from the e-mail link: creates the new password.
export function AdminResetPasswordPage() {
  const [token] = useState(readToken)
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    if (form.password.length < 10) { setMessage('A senha precisa ter pelo menos 10 caracteres.'); return }
    if (form.password !== form.confirm) { setMessage('As duas senhas não são iguais.'); return }
    setBusy(true)
    try { await resetAdminPassword(token, form.password); setDone(true); window.history.replaceState(null, '', window.location.pathname) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  if (!validToken(token) && !done) return card('Link incompleto', <><p className="eyebrow">Recuperar acesso</p><h1>Link incompleto</h1><p className="admin-message" role="alert">Abra o link exatamente como chegou no e-mail, ou peça um novo.</p><Link className="button button-primary" to="/admin/esqueci-a-senha">Pedir novo link</Link></>)
  if (done) return card('Senha criada', <><p className="eyebrow">Tudo certo</p><h1>Senha nova criada!</h1><p>Por segurança, os acessos que estavam abertos foram encerrados. Entre de novo com a senha nova.</p><Link className="button button-primary" to="/admin">Ir para o login</Link></>)
  return card('Criar senha nova', <>
    <p className="eyebrow">Recuperar acesso</p>
    <h1>Criar senha nova</h1>
    <label>Senha nova<input type="password" autoComplete="new-password" minLength="10" maxLength="200" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /><small>Pelo menos 10 caracteres. Uma frase fácil de lembrar funciona bem.</small></label>
    <label>Repita a senha<input type="password" autoComplete="new-password" minLength="10" maxLength="200" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} required /></label>
    <p className="admin-message" role="alert">{message}</p>
    <button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar senha nova'}</button>
  </>, submit)
}
