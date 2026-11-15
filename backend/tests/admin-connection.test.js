import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertDevelopmentSeedTarget } from '../src/database/adminConnection.js'

afterEach(() => vi.unstubAllEnvs())

describe('development seed safety', () => {
  it('accepts only the local development database', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(() => assertDevelopmentSeedTarget(
      new URL('postgresql://admin:placeholder@localhost:5432/rusticerrado'),
    )).not.toThrow()
  })

  it('rejects every test database', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(() => assertDevelopmentSeedTarget(
      new URL('postgresql://admin:placeholder@localhost:5432/rusticerrado_test'),
    )).toThrow('não pode usar o banco de testes')
  })

  it('rejects production even when the database name is correct', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => assertDevelopmentSeedTarget(
      new URL('postgresql://admin:placeholder@localhost:5432/rusticerrado'),
    )).toThrow('proibido em NODE_ENV=production')
  })
})
