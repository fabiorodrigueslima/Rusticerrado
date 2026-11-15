// A API Express como uma única Netlify Function. O netlify.toml redireciona /api/*, /sitemap.xml
// e (para robôs de pré-visualização de links, via edge function) /produto/* para esta função.
// Deve permanecer como a primeira importação: define NODE_ENV/TRUST_PROXY antes que o app leia sua configuração.
import '../lib/runtime-defaults.mjs'
import serverless from 'serverless-http'
import { app } from '../../backend/src/app.js'

const FUNCTION_PREFIX = /^\/\.netlify\/functions\/api(?=\/|$)/

// Netlify may hand us either the original path or the rewrite target; both map to the
// same Express route once the function prefix is removed.
export function toAppPath(url) {
  const path = url.replace(FUNCTION_PREFIX, '')
  return path.startsWith('/') ? path : `/${path}`
}

// Netlify sets x-nf-client-connection-ip itself; a client cannot forge it. Rate limits and
// login throttling read req.ip, which (with TRUST_PROXY=1) comes from x-forwarded-for, so the
// client-supplied value is replaced by Netlify's.
export function prepareRequest(req, event) {
  req.url = toAppPath(req.url)
  const headers = event?.headers ?? {}
  const clientIp = headers['x-nf-client-connection-ip'] ?? headers['X-Nf-Client-Connection-Ip']
  // Netlify always sends it; if it ever does not, every such request shares one rate-limit
  // bucket instead of failing (rate limiters need an address).
  const ip = clientIp || '0.0.0.0'
  req.headers['x-forwarded-for'] = ip
  // The emulated socket has no remote address, so Express could not derive req.ip from the
  // proxy chain; an own property takes precedence over Express's getter.
  Object.defineProperty(req, 'ip', { value: ip, configurable: true, enumerable: true })
}

export const handler = serverless(app, {
  request: prepareRequest,
  binary: ['image/*', 'application/octet-stream'],
})
