import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

// Cloudflare Turnstile: a free "are you human?" check on forms robots like to abuse
// (sign-up and password/activation e-mails). It only switches on when BOTH keys exist, so a
// half-finished setup never blocks the store. The browser sends the token in a header, which
// keeps every body schema strict and unchanged.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const clean = (value) => (typeof value === 'string' ? value.trim() : '')

export function createTurnstile(config = env, fetchImpl = globalThis.fetch) {
  const siteKey = clean(config.TURNSTILE_SITE_KEY)
  const secret = clean(config.TURNSTILE_SECRET_KEY)
  const enabled = Boolean(siteKey && secret)

  // action: a short name per form, checked against what the widget reported.
  const requireHuman = (action) => async (req, _res, next) => {
    if (!enabled) return next()
    const token = req.get('x-turnstile-token') ?? ''
    if (!token || token.length > 2048) return next(new AppError(400, 'BOT_CHECK_REQUIRED', 'Confirme que você não é um robô e tente de novo.'))
    let result
    try {
      const body = new URLSearchParams({ secret, response: token })
      if (req.ip) body.set('remoteip', req.ip)
      const response = await fetchImpl(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(config.EXTERNAL_REQUEST_TIMEOUT_MS ?? 4000) })
      result = response.ok ? await response.json() : null
    } catch {
      result = null
    }
    // Cloudflare unreachable: refuse instead of letting robots through, with a clear message.
    if (!result) return next(new AppError(503, 'BOT_CHECK_UNAVAILABLE', 'Não foi possível confirmar que você não é um robô. Tente de novo em instantes.'))
    if (result.success !== true || (result.action && result.action !== action)) {
      return next(new AppError(400, 'BOT_CHECK_FAILED', 'A verificação anti-robô expirou ou falhou. Confirme de novo e tente outra vez.'))
    }
    return next()
  }

  return { enabled, siteKey: enabled ? siteKey : null, requireHuman }
}

export const turnstile = createTurnstile()
export const requireHuman = turnstile.requireHuman
