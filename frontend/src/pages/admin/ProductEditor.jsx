import { useEffect, useState } from 'react'
import { AdminImageUpload } from '../../components/admin/AdminImageUpload.jsx'
import { getAdminResource, mutateAdminResource } from '../../services/lojaApi.js'
import { StockAdjust } from './AdminOperations.jsx'
import { formatPrice, productStatusLabel, slugify, toPrice } from './adminFormat.js'

const statusActions = {
  DRAFT: [['ACTIVE', 'Publicar no site', 'button-primary']],
  ACTIVE: [['DRAFT', 'Tirar do site (voltar para rascunho)', 'button-ghost']],
  ARCHIVED: [['DRAFT', 'Recuperar como rascunho', 'button-ghost']],
}

const productBody = (product, changes = {}) => ({
  name: product.nome,
  slug: product.slug,
  description: product.descricao ?? '',
  materials: product.materiais || null,
  dimensions: product.medidas || null,
  weightGrams: product.peso_gramas == null ? null : Number(product.peso_gramas),
  care: product.cuidados || null,
  productionDays: Number(product.prazo_producao_dias ?? 0),
  categoryId: product.categoria_id == null ? null : Number(product.categoria_id),
  status: product.status,
  ...changes,
})

function ProductDetails({ product, categories, csrfToken, onSaved }) {
  const [form, setForm] = useState({ nome: product.nome, slug: product.slug, descricao: product.descricao ?? '', materiais: product.materiais ?? '', medidas: product.medidas ?? '', cuidados: product.cuidados ?? '', peso_gramas: product.peso_gramas ?? '', prazo_producao_dias: product.prazo_producao_dias ?? 0, categoria_id: product.categoria_id ?? '' })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      await mutateAdminResource(`products/${product.id}`, 'PUT', productBody(product, {
        name: form.nome.trim(), slug: form.slug, description: form.descricao, materials: form.materiais.trim() || null,
        dimensions: form.medidas.trim() || null, care: form.cuidados.trim() || null,
        weightGrams: form.peso_gramas === '' ? null : Number(form.peso_gramas),
        productionDays: Number(form.prazo_producao_dias || 0), categoryId: form.categoria_id === '' ? null : Number(form.categoria_id),
      }), csrfToken)
      setMessage('Dados salvos.'); onSaved()
    } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  return <form className="checkout-form" onSubmit={submit}>
    <fieldset><legend>Dados da peça</legend>
      <label>Nome<input value={form.nome} onChange={set('nome')} minLength="2" maxLength="160" required /></label>
      <label>Endereço na loja<input value={form.slug} onChange={(event) => setForm({ ...form, slug: slugify(event.target.value) })} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength="180" required /><small>Aparece no link: rusticerrado.com.br/produto/{form.slug || '…'}</small></label>
      <label>Categoria<select value={form.categoria_id} onChange={set('categoria_id')}><option value="">Sem categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}</select></label>
      <label>Descrição<textarea value={form.descricao} onChange={set('descricao')} maxLength="10000" rows="5" /></label>
      <label>Materiais<input value={form.materiais} onChange={set('materiais')} maxLength="2000" placeholder="Ex.: madeira peroba-rosa e resina" /></label>
      <label>Medidas<input value={form.medidas} onChange={set('medidas')} maxLength="1000" placeholder="Ex.: 40 x 25 x 2 cm" /></label>
      <label>Cuidados<textarea value={form.cuidados} onChange={set('cuidados')} maxLength="3000" rows="3" /></label>
      <label>Peso (gramas)<input type="number" min="0" step="0.1" value={form.peso_gramas} onChange={set('peso_gramas')} /></label>
      <label>Prazo de produção (dias)<input type="number" min="0" max="365" value={form.prazo_producao_dias} onChange={set('prazo_producao_dias')} /></label>
    </fieldset>
    <button className="button button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar dados'}</button>
    <p role="status">{message}</p>
  </form>
}

function VariantForm({ variant, productId, csrfToken, onSaved }) {
  const isNew = !variant
  const [form, setForm] = useState({ nome: variant?.nome ?? 'Única', sku: variant?.sku ?? '', preco: formatPrice(variant?.preco), promocional: formatPrice(variant?.preco_promocional), estoque: 0, ativa: variant?.ativa ?? true })
  const [message, setMessage] = useState('')
  const set = (field) => (event) => setForm({ ...form, [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    const price = toPrice(form.preco); const salePrice = form.promocional.trim() ? toPrice(form.promocional) : null
    if (!price) { setMessage('Preço inválido. Ex.: 89,90'); return }
    if (form.promocional.trim() && !salePrice) { setMessage('Preço promocional inválido. Ex.: 79,90'); return }
    const body = { name: form.nome.trim(), sku: form.sku.trim(), price, salePrice, stock: isNew ? Number(form.estoque || 0) : Number(variant.estoque), active: form.ativa, attributes: variant?.atributos ?? {} }
    try {
      await mutateAdminResource(isNew ? `products/${productId}/variants` : `variants/${variant.id}`, isNew ? 'POST' : 'PUT', body, csrfToken)
      setMessage(isNew ? 'Variação adicionada.' : 'Preço salvo.'); onSaved()
    } catch (error) { setMessage(error.message) }
  }
  return <form className="admin-action admin-variant" onSubmit={submit}>
    <label>Nome da variação<input value={form.nome} onChange={set('nome')} maxLength="120" required placeholder="Ex.: Pequena, Grande, Única" /></label>
    <label>Código (SKU)<input value={form.sku} onChange={set('sku')} maxLength="64" required placeholder="Ex.: TABUA-CHURRASCO-01" /></label>
    <label>Preço (R$)<input value={form.preco} onChange={set('preco')} inputMode="decimal" required placeholder="89,90" /></label>
    <label>Preço promocional (opcional)<input value={form.promocional} onChange={set('promocional')} inputMode="decimal" placeholder="Deixe vazio se não houver" /></label>
    {isNew && <label>Estoque inicial<input type="number" min="0" value={form.estoque} onChange={set('estoque')} /></label>}
    <label className="admin-check"><input type="checkbox" checked={form.ativa} onChange={set('ativa')} />Variação disponível para venda</label>
    <button className="button button-ghost">{isNew ? 'Adicionar variação' : 'Salvar preço e dados'}</button>
    <p role="status">{message}</p>
  </form>
}

function ProductImages({ product, csrfToken, onChanged }) {
  const [message, setMessage] = useState('')
  const act = async (work, done) => { setMessage(''); try { await work(); setMessage(done); onChanged() } catch (error) { setMessage(error.message) } }
  return <section className="admin-panel-section">
    <h2>Fotos</h2>
    {product.images.length === 0 && <p className="admin-note">Esta peça ainda não tem fotos. No site aparece a logo da RustiCerrado no lugar da foto.</p>}
    {product.images.length > 0 && <ul className="admin-images">{product.images.map((image) => <li key={image.id}>
      <img src={image.url} alt={image.alt_text} loading="lazy" />
      {image.principal && <span className="admin-badge">Principal</span>}
      <p>{image.alt_text}</p>
      <div>
        {!image.principal && <button type="button" onClick={() => act(() => mutateAdminResource(`images/${image.id}/primary`, 'POST', undefined, csrfToken), 'Foto principal atualizada.')}>Tornar principal</button>}
        <button type="button" className="admin-danger" onClick={() => window.confirm('Apagar esta foto? Não dá para desfazer.') && act(() => mutateAdminResource(`images/${image.id}`, 'DELETE', undefined, csrfToken), 'Foto apagada.')}>Apagar</button>
      </div>
    </li>)}</ul>}
    <p role="status">{message}</p>
    <AdminImageUpload productId={product.id} csrfToken={csrfToken} onUploaded={onChanged} defaultAlt={product.nome} />
  </section>
}

export function ProductEditor({ id, csrfToken, onClose, onChanged }) {
  const [state, setState] = useState({ product: null, categories: [], error: '' })
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const reload = () => { setRevision((value) => value + 1); onChanged?.() }
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getAdminResource(`products/${id}`, {}, controller.signal), getAdminResource('categories', {}, controller.signal)])
      .then(([product, categories]) => setState({ product: product.data, categories: categories.data, error: '' }))
      .catch((error) => { if (error.name !== 'AbortError') setState({ product: null, categories: [], error: error.message }) })
    return () => controller.abort()
  }, [id, revision])
  const back = <button type="button" className="admin-back" onClick={onClose}>← Voltar para a lista</button>
  if (state.error) return <>{back}<div className="admin-state" role="alert">{state.error}</div></>
  if (!state.product) return <>{back}<div className="admin-state" role="status">Carregando peça…</div></>
  const product = state.product
  const activeVariants = product.variants.filter((variant) => variant.ativa)
  const changeStatus = async (status) => {
    setMessage('')
    if (status === 'ACTIVE' && !activeVariants.length) { setMessage('Antes de publicar, cadastre pelo menos uma variação com preço.'); return }
    if (status === 'ARCHIVED' && !window.confirm('Arquivar esta peça? Ela sai do site, mas continua guardada no painel.')) return
    try { await mutateAdminResource(`products/${product.id}`, 'PUT', productBody(product, { status }), csrfToken); setMessage(status === 'ACTIVE' ? 'Peça publicada! Ela já aparece no site.' : 'Situação atualizada.'); reload() } catch (error) { setMessage(error.message) }
  }
  return <div className="admin-editor">
    {back}
    <section className="admin-panel-section admin-status-bar">
      <div><span className={`admin-status admin-status-${product.status.toLowerCase()}`}>{productStatusLabel[product.status] ?? product.status}</span><h2>{product.nome}</h2>
        {product.status === 'ACTIVE' && <a className="text-link" href={`/produto/${product.slug}`} target="_blank" rel="noreferrer">Ver no site</a>}
        {product.status === 'ACTIVE' && !product.images.length && <p className="admin-note">Publicada sem foto: no site aparece a logo da RustiCerrado no lugar da foto.</p>}</div>
      <div className="admin-status-actions">
        {(statusActions[product.status] ?? []).map(([status, label, style]) => <button key={status} type="button" className={`button ${style}`} onClick={() => changeStatus(status)}>{label}</button>)}
        {product.status !== 'ARCHIVED' && <button type="button" className="admin-danger" onClick={() => changeStatus('ARCHIVED')}>Arquivar</button>}
      </div>
      <p role="status" className="admin-status-message">{message}</p>
    </section>
    <ProductImages product={product} csrfToken={csrfToken} onChanged={reload} />
    <section className="admin-panel-section">
      <h2>Preço, variações e estoque</h2>
      <p className="admin-note">Cada variação tem seu preço e seu estoque (ex.: cores ou tamanhos). Se a peça é única, mantenha só a variação "Única".</p>
      <div className="admin-cards">{product.variants.map((variant) => <article key={variant.id} className={variant.ativa ? '' : 'admin-muted'}>
        <h3>{variant.nome}{!variant.ativa && ' (indisponível)'}</h3>
        <p>Estoque: {variant.estoque} · Reservado: {variant.estoque_reservado} · Disponível: {variant.estoque - variant.estoque_reservado}</p>
        <VariantForm variant={variant} productId={product.id} csrfToken={csrfToken} onSaved={reload} />
        <StockAdjust variantId={variant.id} csrfToken={csrfToken} onChanged={reload} />
      </article>)}
      <article><h3>Nova variação</h3><VariantForm key={product.variants.length} productId={product.id} csrfToken={csrfToken} onSaved={reload} /></article></div>
    </section>
    <ProductDetails key={product.atualizado_em} product={product} categories={state.categories} csrfToken={csrfToken} onSaved={reload} />
  </div>
}
