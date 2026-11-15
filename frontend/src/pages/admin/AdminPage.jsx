import '../../styles/admin.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrderDetail, PaymentIncidents, PrivacyRequests, StockAdjust } from './AdminOperations.jsx'
import { ProductEditor } from './ProductEditor.jsx'
import { SettingsPanel } from './SettingsPanel.jsx'
import { PaymentsPanel } from './PaymentsPanel.jsx'
import { TeamPanel } from './TeamPanel.jsx'
import { productStatusLabel, roleLabel, slugify, toPrice } from './adminFormat.js'
import { PageMeta } from '../../components/common/PageMeta.jsx'
import { adminLogin, adminLogout, adminMe, getAdminResource, mutateAdminResource } from '../../services/lojaApi.js'
import { PasswordInput } from '../../components/common/PasswordInput.jsx'

const sections = [{key:'dashboard',label:'Visão geral'},{key:'products',label:'Produtos'},{key:'stock',label:'Estoque'},{key:'orders',label:'Pedidos'},{key:'payment-incidents',label:'Ocorrências de pagamento',roles:['OWNER','MANAGER']},{key:'privacy-requests',label:'Privacidade (LGPD)',roles:['OWNER','MANAGER']},{key:'categories',label:'Categorias'},{key:'collections',label:'Coleções'},{key:'settings',label:'Configurações'},{key:'team',label:'Equipe',roles:['OWNER']}]
const money = (value) => value == null ? '—' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(value))

function Login({ onSuccess }) {
  const [form,setForm]=useState({email:'',password:''});const [error,setError]=useState('');const [loading,setLoading]=useState(false)
  const submit=async(event)=>{event.preventDefault();setLoading(true);setError('');try{const {data}=await adminLogin(form);onSuccess(data)}catch(reason){setError(reason.message)}finally{setLoading(false)}}
  return <main className="admin-login"><PageMeta title="Acesso administrativo" description="Área restrita da RustiCerrado." noindex /><form onSubmit={submit}><p className="eyebrow">Área restrita</p><h1>Painel administrativo</h1><p>Entre com o e-mail e a senha do seu acesso ao painel.</p><label>E-mail<input type="email" autoComplete="username" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required /></label><label>Senha<PasswordInput autoComplete="current-password" minLength="8" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required /></label><p className="admin-message" role="alert">{error}</p><button className="button button-primary" disabled={loading}>{loading?'Entrando…':'Entrar'}</button><p><Link to="/admin/esqueci-a-senha">Esqueci a senha</Link></p></form></main>
}

const emptyCreateForm={name:'',slug:'',slugEdited:false,description:'',sku:'',price:'',stock:1}
function AdminCreate({section,csrfToken,onCreated}){const[form,setForm]=useState(emptyCreateForm);const[message,setMessage]=useState('');if(!['products','categories','collections'].includes(section))return null;const submit=async(event)=>{event.preventDefault();setMessage('');try{if(section==='products'){const price=toPrice(form.price);if(!price){setMessage('Preço inválido. Ex.: 89,90');return}const {data}=await mutateAdminResource('products','POST',{name:form.name.trim(),slug:form.slug,description:form.description,productionDays:0,status:'DRAFT',initialVariant:{name:'Única',sku:form.sku.trim(),price,stock:Number(form.stock||0),active:true,attributes:{}}},csrfToken);setForm(emptyCreateForm);onCreated(data.id);return}await mutateAdminResource(section,'POST',section==='categories'?{name:form.name,slug:form.slug,description:form.description||null,active:true,order:0}:{name:form.name,slug:form.slug,description:form.description||null,active:true,featured:false},csrfToken);setMessage('Registro criado.');setForm(emptyCreateForm);onCreated()}catch(error){setMessage(error.message)}};const setName=e=>setForm({...form,name:e.target.value,slug:form.slugEdited?form.slug:slugify(e.target.value)});const title=section==='products'?'Cadastrar nova peça':section==='categories'?'Nova categoria':'Nova coleção';return <details className="admin-create" open={section!=='products'}><summary>{title}</summary><form className="checkout-form" onSubmit={submit}><fieldset><legend>{title}</legend><label>Nome<input value={form.name} onChange={setName} required/></label><label>Endereço na loja<input value={form.slug} onChange={e=>setForm({...form,slug:slugify(e.target.value),slugEdited:true})} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/><small>Preenchido a partir do nome. Só letras minúsculas, números e hífens.</small></label><label>Descrição<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>{section==='products'&&<><label>Código da peça (SKU)<input value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Ex.: TABUA-CHURRASCO-01" required/></label><label>Preço (R$)<input value={form.price} onChange={e=>setForm({...form,price:e.target.value})} inputMode="decimal" placeholder="89,90" required/></label><label>Estoque<input type="number" min="0" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label></>}</fieldset>{section==='products'&&<p className="admin-note">A peça é criada como rascunho (fora do site). Na tela seguinte você envia as fotos e publica.</p>}<button className="button button-primary">{section==='products'?'Criar e continuar':'Criar'}</button><p role="status">{message}</p></form></details>}

// Hiding a collection only marks it inactive: products and links are kept, and it can be shown again.
function CollectionCard({ row, csrfToken, onChanged }) {
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const change=async(active)=>{
    if(!active&&!window.confirm(`Esconder a coleção "${row.nome}" do site? Nada é apagado: as peças continuam no catálogo e você pode mostrar a coleção de novo quando quiser.`))return
    setBusy(true);setMessage('')
    try{
      if(active)await mutateAdminResource(`collections/${row.id}`,'PUT',{name:row.nome,slug:row.slug,description:row.descricao??null,active:true,featured:Boolean(row.destaque)},csrfToken)
      else await mutateAdminResource(`collections/${row.id}`,'DELETE',undefined,csrfToken)
      onChanged()
    }catch(error){setMessage(error.message)}finally{setBusy(false)}
  }
  return <>
    <span className={`admin-status ${row.ativa?'admin-status-active':'admin-status-archived'}`}>{row.ativa?'Visível no site':'Escondida'}</span>
    <h2>{row.nome}</h2>
    <p>{row.slug}</p>
    {row.ativa
      ?<button type="button" className="admin-danger" disabled={busy} onClick={()=>change(false)}>Esconder do site</button>
      :<button type="button" className="button button-ghost admin-edit" disabled={busy} onClick={()=>change(true)}>Mostrar no site</button>}
    <p role="status">{message}</p>
  </>
}

function Resource({ section, csrfToken, userId, role }) {
  if(section==='settings')return <><SettingsPanel csrfToken={csrfToken} canEdit={role==='OWNER'}/>{role==='OWNER'&&<PaymentsPanel csrfToken={csrfToken}/>}</>
  if(section==='team')return <TeamPanel csrfToken={csrfToken} currentUserId={userId}/>
  if(section==='payment-incidents')return <PaymentIncidents csrfToken={csrfToken}/>
  if(section==='privacy-requests')return <PrivacyRequests csrfToken={csrfToken}/>
  return <ResourceList key={section} section={section} csrfToken={csrfToken}/>
}

function ResourceList({ section, csrfToken }) {
  const [state,setState]=useState({data:null,integrations:null,error:''})
  const[revision,setRevision]=useState(0)
  const[editing,setEditing]=useState(null)
  useEffect(()=>{const controller=new AbortController();getAdminResource(section,section==='products'||section==='orders'?{page:1,limit:20}:{},controller.signal).then(({data,integrations})=>setState({data,integrations:integrations??null,error:''})).catch((e)=>{if(e.name!=='AbortError')setState({data:null,integrations:null,error:e.message})});return()=>controller.abort()},[section,revision])
  if(section==='products'&&editing)return <ProductEditor id={editing} csrfToken={csrfToken} onClose={()=>setEditing(null)} onChanged={()=>setRevision(v=>v+1)}/>
  if(state.error)return <div className="admin-state" role="alert">{state.error}</div>
  if(!state.data)return <div className="admin-state" role="status">Carregando…</div>
  if(section==='dashboard')return <div className="admin-metrics">{Object.entries(state.data).map(([key,value])=><article key={key}><strong>{value}</strong><span>{({active_products:'Produtos ativos',pending_orders:'Aguardando pagamento',paid_orders:'Pedidos pagos',active_reservations:'Reservas ativas',open_payment_incidents:'Ocorrências de pagamento abertas',open_privacy_requests:'Solicitações LGPD abertas',overdue_privacy_requests:'Solicitações LGPD atrasadas'})[key]??key}</span></article>)}</div>
  const rows=Array.isArray(state.data)?state.data:[]
  const created=(id)=>{setRevision(v=>v+1);if(section==='products'&&id)setEditing(id)}
  if(!rows.length)return <><AdminCreate section={section} csrfToken={csrfToken} onCreated={created}/><div className="admin-state">Nenhum registro encontrado.</div></>
  return <><AdminCreate section={section} csrfToken={csrfToken} onCreated={created}/><div className="admin-cards">{rows.map((row,index)=><article key={row.id??index}>{section==='products'&&<><span className={`admin-status admin-status-${String(row.status).toLowerCase()}`}>{productStatusLabel[row.status]??row.status}</span><h2>{row.nome}</h2><p>{row.categoria||'Sem categoria'}</p><p>{money(row.preco_inicial)} · {row.estoque_disponivel} disponíveis</p><button type="button" className="button button-primary admin-edit" onClick={()=>setEditing(row.id)}>Editar, fotos e publicar</button></>}{section==='stock'&&<><h2>{row.produto}</h2><p>{row.variante} · SKU {row.sku}</p><p>Físico: {row.estoque} · Reservado: {row.estoque_reservado} · Disponível: {row.disponivel}</p><StockAdjust variantId={row.id} csrfToken={csrfToken} onChanged={()=>setRevision(v=>v+1)}/></>}{section==='orders'&&<><h2>{row.codigo_publico}</h2><p>{row.status} · Pagamento: {row.pagamento_status||'sem cobrança'}</p><p>{money(row.total)} · {new Date(row.criado_em).toLocaleString('pt-BR')} · {row.nome_cliente}</p><details><summary>Detalhes e status</summary><OrderDetail id={row.id} csrfToken={csrfToken} onChanged={()=>setRevision(v=>v+1)}/></details></>}{section==='categories'&&<><h2>{row.nome}</h2><p>{row.ativa?'Ativa':'Inativa'} · {row.slug}</p></>}{section==='collections'&&<CollectionCard row={row} csrfToken={csrfToken} onChanged={()=>setRevision(v=>v+1)}/>}</article>)}</div></>
}

export function AdminPage(){const [session,setSession]=useState(null);const [checking,setChecking]=useState(true);const [section,setSection]=useState(()=>new URLSearchParams(window.location.search).has('pagamentos')?'settings':'dashboard')
  useEffect(()=>{adminMe().then(({data})=>setSession(data)).catch(()=>{}).finally(()=>setChecking(false))},[])
  if(checking)return <div className="admin-state">Verificando acesso…</div>
  if(!session)return <Login onSuccess={setSession}/>
  if(!['OWNER','MANAGER','FULFILLMENT'].includes(session.user.role))return <main className="admin-login"><PageMeta title="Acesso negado" description="Área administrativa restrita." noindex /><h1>Acesso negado</h1><p>Sua sessão não possui permissão para acessar o painel administrativo.</p></main>
  return <div className="admin-shell"><PageMeta title="Painel administrativo" description="Operação da RustiCerrado." noindex /><a className="skip-link" href="#admin-content">Ir para o conteúdo</a><aside><strong>RustiCerrado</strong><span>{session.user.name}<small>{roleLabel[session.user.role] ?? session.user.role}</small></span><nav aria-label="Seções administrativas">{sections.filter(item=>!item.roles||item.roles.includes(session.user.role)).map(item=><button key={item.key} className={section===item.key?'active':''} onClick={()=>setSection(item.key)}>{item.label}</button>)}</nav><button className="admin-logout" onClick={async()=>{if(session.csrfToken)await adminLogout(session.csrfToken);setSession(null)}}>Sair</button></aside><main id="admin-content"><header><p className="eyebrow">Operação</p><h1>{sections.find(item=>item.key===section)?.label}</h1></header><Resource section={section} csrfToken={session.csrfToken} userId={session.user.id} role={session.user.role}/></main></div>}
