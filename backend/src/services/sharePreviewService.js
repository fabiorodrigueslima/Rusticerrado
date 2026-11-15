import { catalogService } from './catalogService.js'

// Link previews (WhatsApp, Facebook, Telegram...) read only the first HTML response and never run
// the React app, so every product used to show the generic site card. The Netlify edge function
// (netlify/edge-functions/share-preview.js) sends just those preview robots here;
// visitors and search engines keep getting the normal site.
const SITE_NAME = 'RustiCerrado'
const FALLBACK_IMAGE = '/brand/rusticerrado-logo.png'
const DESCRIPTION_LIMIT = 200

const escapeHtml = (value) => String(value).replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[char])

// Whole words only, so the preview never ends in the middle of one.
export function shortDescription(text) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= DESCRIPTION_LIMIT) return clean
  const cut = clean.slice(0, DESCRIPTION_LIMIT)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : DESCRIPTION_LIMIT).replace(/[\s,.;:!?-]+$/, '')}…`
}

// Previews look best at 1200x630; Cloudinary crops and compresses the photo on the fly.
export function previewImage(url, origin) {
  if (!url) return origin + FALLBACK_IMAGE
  if (url.startsWith('/')) return origin + url
  return url.replace(/^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/, '$1c_fill,g_auto,w_1200,h_630,f_jpg,q_auto/')
}

function page({ title, description, image, url, type }) {
  const tags = [
    ['og:site_name', SITE_NAME], ['og:locale', 'pt_BR'], ['og:type', type], ['og:title', title],
    ['og:description', description], ['og:url', url], ['og:image', image],
  ].map(([property, content]) => `<meta property="${property}" content="${escapeHtml(content)}">`)
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(url)}">
${tags.join('\n')}
<meta name="twitter:card" content="summary_large_image">
</head>
<body><p><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></p></body>
</html>
`
}

export function createSharePreviewService(catalog = catalogService) {
  return {
    async product(slug, baseUrl) {
      const origin = baseUrl.replace(/\/$/, '')
      const url = `${origin}/produto/${slug}`
      try {
        const product = await catalog.getProduct(slug)
        const photo = product.images.find((image) => image.primary) ?? product.images[0]
        return {
          status: 200,
          html: page({
            title: product.seo?.title || `${product.name} | ${SITE_NAME}`,
            description: shortDescription(product.seo?.description || product.description),
            image: previewImage(photo?.url, origin),
            url,
            type: 'product',
          }),
        }
      } catch (error) {
        if (error.status !== 404) throw error
        return {
          status: 404,
          html: page({ title: SITE_NAME, description: 'Biojoias em cerâmica criadas à mão.', image: origin + FALLBACK_IMAGE, url: origin + '/', type: 'website' }),
        }
      }
    },
  }
}
export const sharePreviewService = createSharePreviewService()
