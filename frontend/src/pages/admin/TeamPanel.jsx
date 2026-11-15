import { useEffect, useState } from 'react'
import { getAdminResource, mutateAdminResource } from '../../services/lojaApi.js'
import { roleLabel } from './adminFormat.js'

const date = (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca'

function InviteForm({ csrfToken, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'OWNER' })
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setMessage(''); setBusy(true)
    try {
      const { data } = await mutateAdminResource('team/invites', 'POST', { name: form.name.trim(), email: form.email.trim(), role: form.role }, csrfToken)
      setResult({ name: data.invite.nome, link: `${window.location.origin}/admin/convite#${data.token}`, expiresAt: data.invite.expira_em })
      setForm({ name: '', email: '', role: 'OWNER' }); onCreated()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(result.link); setMessage('Link copiado!') } catch { setMessage('Não foi possível copiar. Selecione o link e copie manualmente.') } }
  const whatsappText = result && encodeURIComponent(`Olá, ${result.name.split(' ')[0]}! Este é o seu convite para o painel da RustiCerrado. Abra o link e crie a sua senha (vale por 48 horas, uso único):\n${result.link}`)
  return <section className="admin-panel-section">
    <h2>Convidar alguém</h2>
    <p className="admin-note">A pessoa recebe um link, abre e cria a própria senha. Ninguém mais fica sabendo a senha. O link vale por 48 horas e funciona uma vez só.</p>
    {result ? <div className="admin-invite-result">
      <p><strong>Convite criado para {result.name}.</strong> Envie o link abaixo só para essa pessoa. Ele não aparece de novo depois que você sair desta tela.</p>
      <input readOnly value={result.link} onFocus={(event) => event.target.select()} aria-label="Link do convite" />
      <div className="admin-status-actions">
        <button type="button" className="button button-primary" onClick={copy}>Copiar link</button>
        <a className="button button-ghost" href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noreferrer">Enviar pelo WhatsApp</a>
        <button type="button" className="admin-back" onClick={() => { setResult(null); setMessage('') }}>Convidar outra pessoa</button>
      </div>
      <p role="status">{message}</p>
    </div> : <form className="checkout-form" onSubmit={submit}>
      <fieldset><legend>Dados da pessoa</legend>
        <label>Nome<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength="2" maxLength="120" required /></label>
        <label>E-mail<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength="254" required /></label>
        <label>Tipo de acesso<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
          <option value="OWNER">Dona/Dono: acesso completo, inclusive a equipe</option>
          <option value="MANAGER">Gerente: tudo, menos mudar configurações e equipe</option>
          <option value="FULFILLMENT">Expedição: só estoque e pedidos</option>
        </select></label>
      </fieldset>
      <button className="button button-primary" disabled={busy}>{busy ? 'Gerando…' : 'Gerar link de convite'}</button>
      <p role="status">{message}</p>
    </form>}
  </section>
}

export function TeamPanel({ csrfToken, currentUserId }) {
  const [state, setState] = useState({ data: null, error: '' })
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const reload = () => setRevision((value) => value + 1)
  useEffect(() => {
    const controller = new AbortController()
    getAdminResource('team', {}, controller.signal).then(({ data }) => setState({ data, error: '' })).catch((error) => { if (error.name !== 'AbortError') setState({ data: null, error: error.message }) })
    return () => controller.abort()
  }, [revision])
  const act = async (work, done) => { setMessage(''); try { await work(); setMessage(done); reload() } catch (error) { setMessage(error.message) } }
  if (state.error) return <div className="admin-state" role="alert">{state.error}</div>
  if (!state.data) return <div className="admin-state" role="status">Carregando…</div>
  return <div className="admin-editor">
    <InviteForm csrfToken={csrfToken} onCreated={reload} />
    <section className="admin-panel-section">
      <h2>Quem tem acesso</h2>
      <p role="status" className="admin-status-message">{message}</p>
      <div className="admin-cards">{state.data.admins.map((admin) => <article key={admin.id} className={admin.ativo ? '' : 'admin-muted'}>
        <span className={`admin-status ${admin.ativo ? 'admin-status-active' : 'admin-status-archived'}`}>{admin.ativo ? 'Ativo' : 'Desativado'}</span>
        <h3>{admin.nome}{String(admin.id) === String(currentUserId) && ' (você)'}</h3>
        <p>{admin.email}</p>
        <p>{roleLabel[admin.papel] ?? admin.papel} · último acesso: {date(admin.ultimo_login_em)}</p>
        {String(admin.id) !== String(currentUserId) && (admin.ativo
          ? <button type="button" className="admin-danger" onClick={() => window.confirm(`Desativar o acesso de ${admin.nome}? A pessoa sai do painel na hora.`) && act(() => mutateAdminResource(`team/${admin.id}/active`, 'POST', { active: false }, csrfToken), 'Acesso desativado.')}>Desativar acesso</button>
          : <div className="admin-status-actions admin-team-actions">
            <button type="button" className="button button-ghost" onClick={() => act(() => mutateAdminResource(`team/${admin.id}/active`, 'POST', { active: true }, csrfToken), 'Acesso reativado.')}>Reativar acesso</button>
            <button type="button" className="admin-danger" onClick={() => window.confirm(`Remover ${admin.nome} da lista? O acesso é encerrado de vez. Para voltar, será preciso um novo convite.`) && act(() => mutateAdminResource(`team/${admin.id}`, 'DELETE', undefined, csrfToken), `${admin.nome} foi removido(a) da lista.`)}>Remover da lista</button>
          </div>)}
      </article>)}</div>
    </section>
    {state.data.invites.length > 0 && <section className="admin-panel-section">
      <h2>Convites aguardando</h2>
      <div className="admin-cards">{state.data.invites.map((invite) => <article key={invite.id}>
        <h3>{invite.nome}</h3>
        <p>{invite.email} · {roleLabel[invite.papel] ?? invite.papel}</p>
        <p>Vale até {date(invite.expira_em)}</p>
        <button type="button" className="admin-danger" onClick={() => window.confirm('Cancelar este convite? O link deixa de funcionar.') && act(() => mutateAdminResource(`team/invites/${invite.id}`, 'DELETE', undefined, csrfToken), 'Convite cancelado.')}>Cancelar convite</button>
      </article>)}</div>
    </section>}
  </div>
}
