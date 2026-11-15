import { describe, expect, it } from 'vitest'
import { databaseSsl } from '../src/config/databaseSsl.js'

describe('databaseSsl', () => {
  it('turns TLS off only when DB_SSL is not true', () => {
    expect(databaseSsl({})).toBe(false)
    expect(databaseSsl({ DB_SSL: 'false' })).toBe(false)
    expect(databaseSsl({ DB_SSL: false })).toBe(false)
  })

  it('always verifies the certificate when TLS is on', () => {
    expect(databaseSsl({ DB_SSL: 'true' })).toEqual({ rejectUnauthorized: true })
    expect(databaseSsl({ DB_SSL: true })).toEqual({ rejectUnauthorized: true })
  })

  it('accepts the CA as text with literal \\n', () => {
    const ssl = databaseSsl({ DB_SSL: 'true', DB_SSL_CA: '-----BEGIN CERTIFICATE-----\\nABC\\n-----END CERTIFICATE-----' })
    expect(ssl).toEqual({ rejectUnauthorized: true, ca: '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----' })
  })

  it('explains where to get a missing CA file', () => {
    expect(() => databaseSsl({ DB_SSL: 'true', DB_SSL_CA_FILE: 'certs/nao-existe.crt' })).toThrow(/Supabase/)
  })
})
