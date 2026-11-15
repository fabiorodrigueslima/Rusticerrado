import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { app } from '../src/app.js'
import { verifyPassword } from '../src/security/password.js'
import { createAdminTeamService } from '../src/services/adminTeamService.js'

describe('admin team API', () => {
  it('requires an owner session to see or change the team', async () => {
    expect((await request(app).get('/api/v1/admin/team')).status).toBe(401)
    expect((await request(app).post('/api/v1/admin/team/invites').send({ name: 'Ana', email: 'ana@example.com', role: 'OWNER' })).status).toBe(401)
    expect((await request(app).post('/api/v1/admin/team/1/active').send({ active: false })).status).toBe(401)
    expect((await request(app).delete('/api/v1/admin/team/1')).status).toBe(401)
  })

  it('rejects malformed invite tokens and weak passwords before touching the database', async () => {
    expect((await request(app).post('/api/v1/admin/invites/inspect').send({ token: 'curto' })).status).toBe(400)
    expect((await request(app).post('/api/v1/admin/invites/accept').send({ token: 'a'.repeat(43), password: 'curta' })).status).toBe(400)
  })
})

describe('admin team service', () => {
  it('stores only the hash of the invite token and returns the token once', async () => {
    const repository = { createInvite: vi.fn(async (value) => ({ id: 1, email: value.email })) }
    const { invite, token } = await createAdminTeamService(repository).createInvite({ name: 'Ana', email: 'ana@example.com', role: 'OWNER', createdBy: 7 })
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const saved = repository.createInvite.mock.calls[0][0]
    expect(saved.tokenHash).toMatch(/^[a-f0-9]{64}$/)
    expect(saved.tokenHash).not.toContain(token)
    expect(saved).toMatchObject({ createdBy: 7, hours: 48 })
    expect(invite).toEqual({ id: 1, email: 'ana@example.com' })
  })

  it('hashes the chosen password and reports expired or used links clearly', async () => {
    const repository = {
      acceptInvite: vi.fn(async (_hash, passwordHash) => ({ id: '9', nome: 'Ana', email: 'ana@example.com', papel: 'OWNER', passwordHash })),
      findInvite: vi.fn(async () => null),
    }
    const service = createAdminTeamService(repository)
    const admin = await service.accept({ token: 'b'.repeat(43), password: 'senha bem longa' })
    expect(admin).toEqual({ id: 9, name: 'Ana', email: 'ana@example.com', role: 'OWNER' })
    expect(await verifyPassword('senha bem longa', repository.acceptInvite.mock.calls[0][1])).toBe(true)
    await expect(service.inspect('c'.repeat(43))).rejects.toMatchObject({ code: 'INVITE_INVALID', status: 410 })
  })
})
