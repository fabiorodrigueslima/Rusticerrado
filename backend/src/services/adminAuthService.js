import { createHash, randomBytes } from 'node:crypto'
import { deriveCsrf } from '../security/csrf.js'
import { env } from '../config/env.js'
import { adminAuthRepository } from '../repositories/adminAuthRepository.js'
import { emailProvider } from '../providers/emailProvider.js'
import { loginThrottle, sourceKey } from '../security/loginThrottle.js'
import { hashPassword, timingDummyHash, verifyPassword } from '../security/password.js'
import { AppError } from '../utils/AppError.js'

const hash = (value) => createHash('sha256').update(value).digest('hex')
const randomToken = () => randomBytes(32).toString('base64url')
const fingerprint = (value = '') => hash(value).slice(0, 64)
const csrfFor = (token) => deriveCsrf(token, 'admin')

export function createAdminAuthService(repository = adminAuthRepository, throttle = loginThrottle, email = emailProvider, config = env) {
  return {
    // Always answers the same way, so the form never reveals which e-mails are administrators.
    // The link carries the token in the URL fragment (#), which browsers do not send to servers.
    async forgot(emailAddress, requestId) {
      const admin = await repository.findByEmail(emailAddress)
      if (!admin?.ativo) return { accepted: true }
      const token = randomToken()
      await repository.createReset(admin.id, hash(token))
      const site = (config.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '')
      try {
        await email.sendPasswordReset({ email: admin.email, resetUrl: `${site}/admin/redefinir-senha#${token}` })
        await repository.audit({ adminId: admin.id, action: 'ADMIN_PASSWORD_RESET_REQUEST', requestId })
      } catch (error) {
        await repository.audit({ adminId: admin.id, action: 'ADMIN_PASSWORD_RESET_REQUEST', result: 'FAILED', requestId, metadata: { reason: error.code ?? 'EMAIL_ERROR' } })
        console.error(JSON.stringify({ event: 'ADMIN_RESET_EMAIL_FAILED', code: error.code ?? 'EMAIL_ERROR' }))
      }
      return { accepted: true, ...(config.NODE_ENV === 'development' ? { developmentResetToken: token } : {}) }
    },
    async resetPassword(token, password, requestId) {
      const adminId = await repository.consumeReset(hash(token), await hashPassword(password))
      await repository.audit({ adminId, action: 'ADMIN_PASSWORD_RESET', requestId })
      return { reset: true }
    },
    async login({ email, password, requestId, ip, userAgent }) {
      const admin = await repository.findByEmail(email)
      const source = sourceKey(ip)
      const blocked = Boolean(admin) && await throttle.isBlocked('ADMIN', admin.id, source)
      // The password is always hashed, even for unknown or blocked accounts, so response
      // time does not reveal which accounts exist or are currently locked.
      const passwordOk = await verifyPassword(password, admin?.password_hash ?? await timingDummyHash())
      const valid = admin && admin.ativo && !blocked && passwordOk
      if (!valid) {
        // Attempts made during a lock do not extend it, so an attacker cannot keep the owner out forever.
        if (admin && !blocked) await throttle.recordFailure('ADMIN', admin.id, source)
        await repository.audit({ adminId: admin?.id, action: 'ADMIN_LOGIN', result: 'DENIED', requestId, metadata: blocked ? { reason: 'THROTTLED' } : {} })
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Credenciais inválidas.')
      }
      await throttle.recordSuccess('ADMIN', admin.id, source)
      const token = randomToken(); const csrf = csrfFor(token)
      await repository.createSession(admin.id, hash(token), hash(csrf), fingerprint(ip), fingerprint(userAgent), env.ADMIN_SESSION_HOURS)
      await repository.recordSuccess(admin.id)
      await repository.audit({ adminId: admin.id, action: 'ADMIN_LOGIN', requestId })
      return { token, csrf, user: { id: Number(admin.id), name: admin.nome, email: admin.email, role: admin.papel } }
    },
    async authenticate(token) { if (!token) return null; return repository.findSession(hash(token)) },
    // Sessions created before derived tokens are migrated once; afterwards this is read-only.
    async refreshCsrf(session, token) { const csrf=csrfFor(token);if(hash(csrf)!==session.csrf_secret_hash)await repository.rotateCsrf(session.id,hash(csrf));return csrf },
    async logout(token, session, requestId) { if (token) await repository.revoke(hash(token)); if (session) await repository.audit({ adminId: session.admin_id, action: 'ADMIN_LOGOUT', requestId }) },
    hash,
  }
}
export const adminAuthService = createAdminAuthService()
