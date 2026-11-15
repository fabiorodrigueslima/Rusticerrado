import { createHash } from 'node:crypto'
import { query } from '../config/database.js'
import { enqueueOpsAlert } from '../services/opsAlerts.js'

// Two independent limits per account:
//  - per source network: stops brute force from one place without letting that place
//    lock the real owner out from anywhere else;
//  - account-wide: stops distributed attacks that rotate sources, at a higher threshold.
// Both locks grow progressively (doubling) and decay after a quiet period.
export const LOGIN_POLICY = Object.freeze({
  source: { maxFailures: 5, windowMinutes: 15, baseLockMinutes: 15, maxLockMinutes: 1440 },
  account: { maxFailures: 20, windowMinutes: 60, baseLockMinutes: 15, maxLockMinutes: 240 },
  decayHours: 24,
})
const ACCOUNT = 'ALL'

// IPv6 clients usually control a whole /64, so rotating addresses inside it is free.
export function networkOf(ip = '') {
  const v4 = String(ip).match(/^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/i)
  if (v4) return v4[1]
  if (!String(ip).includes(':')) return String(ip)
  const [head, tail = ''] = String(ip).toLowerCase().split('%')[0].split('::')
  const left = head ? head.split(':') : []
  const right = tail ? tail.split(':') : []
  const groups = [...left, ...Array(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
  return `${groups.slice(0, 4).map((group) => parseInt(group || '0', 16).toString(16)).join(':')}::/64`
}
export const sourceKey = (ip) => createHash('sha256').update(networkOf(ip)).digest('hex')

export function createLoginThrottle(db = query) {
  const bump = async (scope, accountId, origin, limits) => {
    const counted = await db({
      text: `INSERT INTO app.login_throttle(escopo,conta_id,origem,falhas,janela_inicio) VALUES($1,$2,$3,1,now())
        ON CONFLICT(escopo,conta_id,origem) DO UPDATE SET
          falhas=CASE WHEN app.login_throttle.janela_inicio < now()-make_interval(mins => $4) THEN 1 ELSE app.login_throttle.falhas+1 END,
          janela_inicio=CASE WHEN app.login_throttle.janela_inicio < now()-make_interval(mins => $4) THEN now() ELSE app.login_throttle.janela_inicio END,
          bloqueios=CASE WHEN app.login_throttle.bloqueado_ate < now()-make_interval(hours => $5) THEN 0 ELSE app.login_throttle.bloqueios END,
          atualizado_em=now()
        RETURNING falhas`,
      values: [scope, accountId, origin, limits.windowMinutes, LOGIN_POLICY.decayHours],
    })
    if (counted.rows[0].falhas < limits.maxFailures) return false
    // Only one concurrent request can cross the threshold: it resets the counter.
    const locked = await db({
      text: `UPDATE app.login_throttle SET falhas=0,janela_inicio=now(),bloqueios=bloqueios+1,atualizado_em=now(),
          bloqueado_ate=now()+make_interval(mins => LEAST($5::integer, $4::integer * (2 ^ LEAST(bloqueios, 10))::integer))
        WHERE escopo=$1 AND conta_id=$2 AND origem=$3 AND falhas >= $6 RETURNING bloqueado_ate`,
      values: [scope, accountId, origin, limits.baseLockMinutes, limits.maxLockMinutes, limits.maxFailures],
    })
    return locked.rowCount === 1
  }
  return {
    async isBlocked(scope, accountId, source) {
      const result = await db({
        text: `SELECT 1 FROM app.login_throttle WHERE escopo=$1 AND conta_id=$2 AND origem IN ($3,'${ACCOUNT}') AND bloqueado_ate > now() LIMIT 1`,
        values: [scope, accountId, source],
      })
      return result.rowCount > 0
    },
    async recordFailure(scope, accountId, source) {
      const sourceLocked = await bump(scope, accountId, source, LOGIN_POLICY.source)
      const accountLocked = await bump(scope, accountId, ACCOUNT, LOGIN_POLICY.account)
      if (accountLocked && scope === 'ADMIN')
        await enqueueOpsAlert({ query: db }, { key: `admin-login-lock:${accountId}:${Date.now()}`, kind: 'ADMIN_ACCOUNT_LOCKED', title: 'Conta administrativa bloqueada por excesso de tentativas de login', reference: `ADMIN-${accountId}`, adminSection: 'dashboard' })
      return { sourceLocked, accountLocked }
    },
    // A correct password clears only this source; the account-wide window keeps
    // counting so an attacker cannot reset it by mixing in a valid login.
    async recordSuccess(scope, accountId, source) {
      await db({ text: `DELETE FROM app.login_throttle WHERE escopo=$1 AND conta_id=$2 AND origem=$3`, values: [scope, accountId, source] })
    },
  }
}
export const loginThrottle = createLoginThrottle()
