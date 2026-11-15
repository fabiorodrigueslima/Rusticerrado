import { query } from '../config/database.js'

// Public pages that always exist. Account, cart, checkout and admin pages stay out:
// they are private and robots.txt already asks search engines to skip them.
export const STATIC_PATHS = [
  '/', '/loja', '/novidades', '/promocoes', '/brincos', '/aneis', '/colares', '/pulseiras',
  '/colecoes', '/cursos', '/sobre', '/como-e-feito', '/personalizados', '/contato',
  '/privacidade', '/termos', '/trocas-e-devolucoes',
]

const escapeXml = (value) => String(value).replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char])
const day = (value) => (value instanceof Date ? value : new Date(value)).toISOString().slice(0, 10)

export function createSitemapService(db = query) {
  return {
    // Only what a visitor can open: published products, active collections, published courses.
    async build(baseUrl) {
      const origin = baseUrl.replace(/\/$/, '')
      const [products, collections, courses] = await Promise.all([
        db(`SELECT slug,atualizado_em FROM app.produtos WHERE status='ACTIVE' ORDER BY slug`),
        db(`SELECT slug,atualizado_em FROM app.colecoes WHERE ativa ORDER BY slug`),
        db(`SELECT slug,atualizado_em FROM app.cursos WHERE status='PUBLISHED' AND publicado_em <= now() ORDER BY slug`),
      ])
      const entries = [
        ...STATIC_PATHS.map((path) => ({ path, lastmod: null })),
        ...products.rows.map((row) => ({ path: `/produto/${row.slug}`, lastmod: row.atualizado_em })),
        ...collections.rows.map((row) => ({ path: `/colecoes/${row.slug}`, lastmod: row.atualizado_em })),
        ...courses.rows.map((row) => ({ path: `/cursos/${row.slug}`, lastmod: row.atualizado_em })),
      ]
      const urls = entries.map(({ path, lastmod }) => `  <url><loc>${escapeXml(origin + (path === '/' ? '/' : path))}</loc>${lastmod ? `<lastmod>${day(lastmod)}</lastmod>` : ''}</url>`)
      return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
    },
  }
}
export const sitemapService = createSitemapService()
