// Helpers shared by the admin screens.
export const productStatusLabel = { DRAFT: 'Rascunho', ACTIVE: 'Publicado', ARCHIVED: 'Arquivado' }
export const roleLabel = { OWNER: 'Dona/Dono', MANAGER: 'Gerente', FULFILLMENT: 'Expedição' }

// "Tábua de Churrasco!" -> "tabua-de-churrasco"
export function slugify(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 180)
}

// Accepts "89,9", "89.90", "R$ 1.089,50" and returns "1089.50"; null when it is not a price.
export function toPrice(value) {
  const cleaned = String(value ?? '').replace(/[R$\s]/g, '')
  if (!cleaned) return null
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalized)) return null
  return Number(normalized).toFixed(2)
}

export function formatPrice(value) {
  return value == null ? '' : String(value).replace('.', ',')
}
