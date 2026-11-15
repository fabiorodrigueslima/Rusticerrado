import { createHash, randomBytes } from 'node:crypto'
import { env } from '../config/env.js'
import { query, transaction } from '../config/database.js'
import { createSecretBox } from '../security/secretBox.js'
import { AppError } from '../utils/AppError.js'

// "Conectar Mercado Pago": the store owner authorizes her own account (OAuth authorization
// code + PKCE) and the site keeps the resulting tokens encrypted. Nobody copies credentials.
const PROVIDER = 'mercado-pago'
const STATE_MINUTES = 10
const DEFAULT_TOKEN_SECONDS = 180 * 24 * 60 * 60
// Renew well before the 180-day expiry; a failed renewal still leaves weeks to reconnect.
const RENEW_WHEN_DAYS_LEFT = 30

const sha256 = (value) => createHash('sha256').update(value).digest()
const hex = (value) => sha256(value).toString('hex')
const random = (bytes) => randomBytes(bytes).toString('base64url')

export function createPaymentConnectionService({ db = query, tx = transaction, fetchImpl = fetch, config = env, now = () => Date.now() } = {}) {
  const configured = () => Boolean(config.MERCADO_PAGO_CLIENT_ID && config.MERCADO_PAGO_CLIENT_SECRET && config.PAYMENT_TOKEN_KEY && config.PUBLIC_BACKEND_URL)
  const box = () => {
    if (!configured()) throw new AppError(503, 'PAYMENT_APP_NOT_CONFIGURED', 'A conexão com o Mercado Pago ainda não foi preparada pelo desenvolvedor.')
    return createSecretBox(config.PAYMENT_TOKEN_KEY)
  }
  const redirectUri = () => `${config.PUBLIC_BACKEND_URL.replace(/\/$/, '')}/api/v1/admin/payments/mercado-pago/callback`

  async function tokenRequest(body) {
    const response = await fetchImpl(`${config.MERCADO_PAGO_API_URL.replace(/\/$/, '')}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: config.MERCADO_PAGO_CLIENT_ID, client_secret: config.MERCADO_PAGO_CLIENT_SECRET, ...body }),
      signal: AbortSignal.timeout(config.EXTERNAL_REQUEST_TIMEOUT_MS ?? 4000),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string')
      throw new AppError(502, 'PAYMENT_OAUTH_FAILED', 'O Mercado Pago não confirmou a autorização. Tente conectar de novo.')
    const seconds = Number.isInteger(data.expires_in) && data.expires_in > 0 ? data.expires_in : DEFAULT_TOKEN_SECONDS
    return { ...data, expiresAt: new Date(now() + seconds * 1000) }
  }

  return {
    configured,

    async status() {
      const row = (await db({ text: `SELECT conta_id,modo_producao,conectado_em,renovado_em,expira_em FROM app.integracao_pagamento WHERE provedor=$1`, values: [PROVIDER] })).rows[0]
      return {
        appConfigured: configured(),
        connected: Boolean(row),
        ...(row ? { accountId: row.conta_id, liveMode: row.modo_producao, connectedAt: row.conectado_em, renewedAt: row.renovado_em, expiresAt: row.expira_em } : {}),
      }
    },

    // Returns the Mercado Pago page where the owner logs in and authorizes the store.
    async startAuthorization(adminId) {
      const sealer = box()
      const state = random(32)
      const verifier = random(64)
      await db({
        text: `INSERT INTO app.oauth_estados(state_hash,provedor,admin_id,code_verifier_cifrado,expira_em) VALUES($1,$2,$3,$4,now()+make_interval(mins => $5))`,
        values: [hex(state), PROVIDER, adminId, sealer.seal(verifier), STATE_MINUTES],
      })
      const url = new URL(config.MERCADO_PAGO_AUTH_URL)
      for (const [key, value] of Object.entries({ client_id: config.MERCADO_PAGO_CLIENT_ID, response_type: 'code', platform_id: 'mp', state, redirect_uri: redirectUri(), code_challenge: sha256(verifier).toString('base64url'), code_challenge_method: 'S256' }))
        url.searchParams.set(key, value)
      return { authorizationUrl: url.toString() }
    },

    // Mercado Pago sends the browser back here. The admin cookie does not come along on this
    // cross-site redirect, so the single-use state is what proves who started the connection.
    async completeAuthorization({ code, state }) {
      const sealer = box()
      return tx(async (client) => {
        const found = await client.query({
          text: `UPDATE app.oauth_estados SET usado_em=now() WHERE state_hash=$1 AND provedor=$2 AND usado_em IS NULL AND expira_em>now() RETURNING admin_id,code_verifier_cifrado`,
          values: [hex(state), PROVIDER],
        })
        if (!found.rowCount) throw new AppError(400, 'PAYMENT_OAUTH_STATE_INVALID', 'Este pedido de conexão expirou ou já foi usado. Clique em Conectar de novo.')
        const { admin_id: adminId, code_verifier_cifrado: sealedVerifier } = found.rows[0]
        const token = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: sealer.open(sealedVerifier), test_token: 'false' })
        const accountId = String(token.user_id ?? '').trim()
        if (!/^\d{1,30}$/.test(accountId)) throw new AppError(502, 'PAYMENT_OAUTH_FAILED', 'O Mercado Pago não informou a conta autorizada.')
        await client.query({
          text: `INSERT INTO app.integracao_pagamento(provedor,conta_id,access_token_cifrado,refresh_token_cifrado,public_key,modo_producao,expira_em,conectado_por)
                 VALUES($1,$2,$3,$4,$5,$6,$7,$8)
                 ON CONFLICT (provedor) DO UPDATE SET conta_id=EXCLUDED.conta_id,access_token_cifrado=EXCLUDED.access_token_cifrado,refresh_token_cifrado=EXCLUDED.refresh_token_cifrado,
                   public_key=EXCLUDED.public_key,modo_producao=EXCLUDED.modo_producao,expira_em=EXCLUDED.expira_em,conectado_por=EXCLUDED.conectado_por,conectado_em=now(),renovado_em=NULL`,
          values: [PROVIDER, accountId, sealer.seal(token.access_token), sealer.seal(token.refresh_token), typeof token.public_key === 'string' ? token.public_key.slice(0, 200) : null, token.live_mode !== false, token.expiresAt, adminId],
        })
        return { adminId: Number(adminId), accountId }
      })
    },

    // Token used for payments: the connected account, renewed automatically before it expires.
    async getAccessToken() {
      if (!configured()) return null
      const sealer = box()
      const row = (await db({ text: `SELECT access_token_cifrado,expira_em FROM app.integracao_pagamento WHERE provedor=$1`, values: [PROVIDER] })).rows[0]
      if (!row) return null
      if (new Date(row.expira_em).getTime() - now() > RENEW_WHEN_DAYS_LEFT * 86400000) return sealer.open(row.access_token_cifrado)
      return tx(async (client) => {
        const locked = (await client.query({ text: `SELECT access_token_cifrado,refresh_token_cifrado,expira_em FROM app.integracao_pagamento WHERE provedor=$1 FOR UPDATE`, values: [PROVIDER] })).rows[0]
        if (!locked) return null
        // Another request may have renewed it while this one waited for the lock.
        if (new Date(locked.expira_em).getTime() - now() > RENEW_WHEN_DAYS_LEFT * 86400000) return sealer.open(locked.access_token_cifrado)
        try {
          const token = await tokenRequest({ grant_type: 'refresh_token', refresh_token: sealer.open(locked.refresh_token_cifrado) })
          await client.query({
            text: `UPDATE app.integracao_pagamento SET access_token_cifrado=$2,refresh_token_cifrado=$3,expira_em=$4,renovado_em=now() WHERE provedor=$1`,
            values: [PROVIDER, sealer.seal(token.access_token), sealer.seal(token.refresh_token), token.expiresAt],
          })
          return token.access_token
        } catch (error) {
          console.error(JSON.stringify({ event: 'PAYMENT_TOKEN_RENEWAL_FAILED', code: error.code ?? 'ERROR' }))
          // Still valid for a while: keep selling and let the panel show the reconnect warning.
          if (new Date(locked.expira_em).getTime() > now()) return sealer.open(locked.access_token_cifrado)
          return null
        }
      })
    },

    async disconnect() {
      const result = await db({ text: `DELETE FROM app.integracao_pagamento WHERE provedor=$1`, values: [PROVIDER] })
      return { disconnected: result.rowCount > 0 }
    },
  }
}

export const paymentConnectionService = createPaymentConnectionService()
