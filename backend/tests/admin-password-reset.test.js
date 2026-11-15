import { describe, expect, it, vi } from 'vitest'
import { createAdminAuthService } from '../src/services/adminAuthService.js'

const config = { PUBLIC_FRONTEND_URL: 'https://www.rusticerrado.com.br/', NODE_ENV: 'production', ADMIN_SESSION_HOURS: 8 }
function setup({ admin = { id: 7, email: 'neide@example.com', ativo: true }, sendFails = false } = {}) {
  const repository = {
    findByEmail: vi.fn(async () => admin),
    createReset: vi.fn(async () => {}),
    consumeReset: vi.fn(async () => 7),
    audit: vi.fn(async () => {}),
  }
  const email = { sendPasswordReset: vi.fn(async () => { if (sendFails) throw Object.assign(new Error('x'), { code: 'EMAIL_PROVIDER_ERROR' }) }) }
  return { repository, email, service: createAdminAuthService(repository, {}, email, config) }
}

describe('panel password recovery', () => {
  it('e-mails a one-time link with the token in the URL fragment and stores only its hash', async () => {
    const { repository, email, service } = setup()
    expect(await service.forgot('Neide@Example.com', 'req-1')).toEqual({ accepted: true })
    const { resetUrl, email: to } = email.sendPasswordReset.mock.calls[0][0]
    expect(to).toBe('neide@example.com')
    expect(resetUrl).toMatch(/^https:\/\/www\.rusticerrado\.com\.br\/admin\/redefinir-senha#[A-Za-z0-9_-]{43}$/)
    const token = resetUrl.split('#')[1]
    const [adminId, storedHash] = repository.createReset.mock.calls[0]
    expect(adminId).toBe(7)
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/)
    expect(storedHash).not.toContain(token)
    expect(repository.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_PASSWORD_RESET_REQUEST', adminId: 7 }))
  })

  it('answers the same way for unknown or deactivated e-mails and sends nothing', async () => {
    for (const admin of [null, { id: 9, email: 'x@example.com', ativo: false }]) {
      const { repository, email, service } = setup({ admin })
      expect(await service.forgot('x@example.com')).toEqual({ accepted: true })
      expect(repository.createReset).not.toHaveBeenCalled()
      expect(email.sendPasswordReset).not.toHaveBeenCalled()
    }
  })

  it('still answers normally when the e-mail service fails, and records the failure', async () => {
    const { repository, service } = setup({ sendFails: true })
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await service.forgot('neide@example.com')).toEqual({ accepted: true })
    expect(repository.audit).toHaveBeenCalledWith(expect.objectContaining({ result: 'FAILED' }))
    errors.mockRestore()
  })

  it('stores a new scrypt hash, never the password, when the link is used', async () => {
    const { repository, service } = setup()
    expect(await service.resetPassword('A'.repeat(43), 'uma senha nova longa', 'req-2')).toEqual({ reset: true })
    const [tokenHash, passwordHash] = repository.consumeReset.mock.calls[0]
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(passwordHash).toMatch(/^scrypt\$/)
    expect(passwordHash).not.toContain('uma senha nova longa')
    expect(repository.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'ADMIN_PASSWORD_RESET', adminId: 7 }))
  })
})
