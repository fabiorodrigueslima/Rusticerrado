import { describe, expect, it } from 'vitest'
import { cleanDatabaseUrl, databaseSsl } from '../src/config/databaseSsl.js'

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

describe('cleanDatabaseUrl', () => {
  const neon = 'postgresql://neondb_owner:segredo@ep-cool-river-123456.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

  it('drops the TLS parameters copied from Neon and keeps user, host and database', () => {
    const clean = new URL(cleanDatabaseUrl(neon))
    expect(clean.search).toBe('')
    expect(clean.username).toBe('neondb_owner')
    expect(clean.hostname).toBe('ep-cool-river-123456.sa-east-1.aws.neon.tech')
    expect(clean.pathname).toBe('/neondb')
  })

  it('keeps other parameters and accepts URL objects', () => {
    const clean = cleanDatabaseUrl(new URL('postgresql://u:p@host/db?application_name=x&sslmode=verify-full'))
    expect(clean).toBeInstanceOf(URL)
    expect(clean.search).toBe('?application_name=x')
  })

  it('leaves an empty value alone', () => {
    expect(cleanDatabaseUrl(undefined)).toBeUndefined()
  })
})
