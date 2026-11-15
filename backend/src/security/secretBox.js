import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

// Encrypts provider tokens before they reach the database (AES-256-GCM). The key lives only
// in the hosting environment (PAYMENT_TOKEN_KEY, 32 random bytes in base64), so a database
// leak alone does not expose the store's Mercado Pago account.
const VERSION = 'v1'

export function parseKey(base64) {
  const key = Buffer.from(String(base64 ?? ''), 'base64')
  if (key.length !== 32) throw new Error('PAYMENT_TOKEN_KEY deve ter 32 bytes em base64')
  return key
}

export function createSecretBox(base64Key) {
  const key = parseKey(base64Key)
  return {
    seal(plain) {
      const iv = randomBytes(12)
      const cipher = createCipheriv('aes-256-gcm', key, iv)
      const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
      return [VERSION, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.')
    },
    open(sealed) {
      const [version, iv, tag, data] = String(sealed).split('.')
      if (version !== VERSION || !iv || !tag || !data) throw new Error('SECRET_FORMAT_INVALID')
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'))
      decipher.setAuthTag(Buffer.from(tag, 'base64url'))
      return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
    },
  }
}
