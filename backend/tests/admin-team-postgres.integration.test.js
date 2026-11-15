import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminAuthRepository } from '../src/repositories/adminAuthRepository.js'
import { adminTeamRepository } from '../src/repositories/adminTeamRepository.js'
import { hashPassword, verifyPassword } from '../src/security/password.js'
import { adminTeamService } from '../src/services/adminTeamService.js'

const { Client } = pg
const suffix = `${process.pid}-${Date.now()}`
const ownerEmail = `team-owner-${suffix}@example.com`
const invitedEmail = `team-invited-${suffix}@example.com`
let admin, ownerId
const removedIds = []

describe('admin invites with isolated PostgreSQL', () => {
  beforeAll(async () => {
    admin = new Client({ connectionString: process.env.TEST_DATABASE_ADMIN_URL })
    await admin.connect()
    ownerId = (await admin.query({ text: `INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,'Dono teste',$2,'OWNER') RETURNING id`, values: [ownerEmail, await hashPassword('owner password 123')] })).rows[0].id
  })
  afterAll(async () => {
    if (!admin) return
    const ids = [...(await admin.query({ text: `SELECT id FROM app.usuarios_admin WHERE email = ANY($1)`, values: [[ownerEmail, invitedEmail, `other-${suffix}@example.com`]] })).rows.map((row) => row.id), ...removedIds]
    await admin.query({ text: `DELETE FROM app.admin_convites WHERE usuario_id = ANY($1)`, values: [ids] })
    await admin.query({ text: `DELETE FROM app.admin_convites WHERE criado_por = ANY($1)`, values: [ids] })
    await admin.query({ text: `DELETE FROM app.sessoes WHERE admin_id = ANY($1)`, values: [ids] })
    await admin.query({ text: `DELETE FROM app.audit_logs WHERE admin_id = ANY($1)`, values: [ids] })
    await admin.query({ text: `DELETE FROM app.login_throttle WHERE escopo='ADMIN' AND conta_id = ANY($1)`, values: [ids] })
    await admin.query({ text: `DELETE FROM app.usuarios_admin WHERE id = ANY($1)`, values: [ids] })
    await admin.end()
  })

  it('creates an account from a single-use invite with the password chosen by the invited person', async () => {
    const { invite, token } = await adminTeamService.createInvite({ name: 'Dona da loja', email: invitedEmail, role: 'OWNER', createdBy: ownerId })
    expect((await admin.query({ text: `SELECT token_hash FROM app.admin_convites WHERE id=$1`, values: [invite.id] })).rows[0].token_hash).not.toBe(token)
    await expect(adminTeamService.createInvite({ name: 'Outra', email: invitedEmail.toUpperCase(), role: 'MANAGER', createdBy: ownerId })).rejects.toMatchObject({ code: 'INVITE_PENDING' })
    expect(await adminTeamService.inspect(token)).toMatchObject({ name: 'Dona da loja', email: invitedEmail, role: 'OWNER' })

    // Two simultaneous submissions of the same link create a single administrator.
    const results = await Promise.allSettled([adminTeamService.accept({ token, password: 'senha da dona 2026' }), adminTeamService.accept({ token, password: 'outra senha 2026' })])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    const created = (await admin.query({ text: `SELECT papel,ativo,password_hash FROM app.usuarios_admin WHERE email=$1`, values: [invitedEmail] })).rows
    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({ papel: 'OWNER', ativo: true })
    await expect(adminTeamService.inspect(token)).rejects.toMatchObject({ code: 'INVITE_INVALID' })
    await expect(adminTeamService.createInvite({ name: 'De novo', email: invitedEmail, role: 'OWNER', createdBy: ownerId })).rejects.toMatchObject({ code: 'ADMIN_EXISTS' })
    const winner = results.find((result) => result.status === 'fulfilled')
    expect(winner.value.email).toBe(invitedEmail)
    expect(await verifyPassword('senha da dona 2026', created[0].password_hash) || await verifyPassword('outra senha 2026', created[0].password_hash)).toBe(true)
  })

  it('rejects expired and cancelled invites and lets a new one replace an expired link', async () => {
    const otherEmail = `other-${suffix}@example.com`
    const first = await adminTeamService.createInvite({ name: 'Expirado', email: otherEmail, role: 'MANAGER', createdBy: ownerId })
    await admin.query({ text: `UPDATE app.admin_convites SET criado_em=now()-interval '3 days', expira_em=now()-interval '1 day' WHERE id=$1`, values: [first.invite.id] })
    await expect(adminTeamService.inspect(first.token)).rejects.toMatchObject({ code: 'INVITE_INVALID' })
    const second = await adminTeamService.createInvite({ name: 'Novo convite', email: otherEmail, role: 'MANAGER', createdBy: ownerId })
    await adminTeamService.revokeInvite(Number(second.invite.id))
    await expect(adminTeamService.accept({ token: second.token, password: 'senha qualquer 2026' })).rejects.toMatchObject({ code: 'INVITE_INVALID' })
    await expect(adminTeamService.revokeInvite(Number(second.invite.id))).rejects.toMatchObject({ code: 'INVITE_NOT_FOUND' })
    expect((await adminTeamRepository.list()).invites.some((invite) => invite.email === otherEmail)).toBe(false)
  })

  it('protects the store owners and ends the sessions of a deactivated administrator', async () => {
    const invitedId = (await admin.query({ text: `SELECT id FROM app.usuarios_admin WHERE email=$1`, values: [invitedEmail] })).rows[0].id
    await expect(adminTeamService.setActive(Number(ownerId), false, ownerId)).rejects.toMatchObject({ code: 'CANNOT_DEACTIVATE_SELF' })
    await adminAuthRepository.createSession(invitedId, 'e'.repeat(43), 'f'.repeat(64), '1'.repeat(64), '2'.repeat(64), 8)
    await adminTeamService.setActive(Number(invitedId), false, ownerId)
    expect(await adminAuthRepository.findSession('e'.repeat(43))).toBeNull()
    // With the invited owner inactive, the remaining owner cannot be removed by another account.
    await expect(adminTeamService.setActive(Number(ownerId), false, invitedId)).rejects.toMatchObject({ code: 'LAST_OWNER' })
    await adminTeamService.setActive(Number(invitedId), true, ownerId)
    expect((await adminTeamRepository.list()).admins.find((row) => String(row.id) === String(invitedId))).toMatchObject({ ativo: true })
  })

  it('removes only deactivated administrators, keeps their history and frees the e-mail for a new invite', async () => {
    const invitedId = (await admin.query({ text: `SELECT id FROM app.usuarios_admin WHERE email=$1`, values: [invitedEmail] })).rows[0].id
    removedIds.push(invitedId)
    await expect(adminTeamService.remove(Number(invitedId), ownerId)).rejects.toMatchObject({ code: 'ADMIN_STILL_ACTIVE' })
    await expect(adminTeamService.remove(Number(ownerId), ownerId)).rejects.toMatchObject({ code: 'CANNOT_REMOVE_SELF' })
    await adminTeamService.setActive(Number(invitedId), false, ownerId)
    await adminTeamService.remove(Number(invitedId), ownerId)
    expect((await adminTeamRepository.list()).admins.some((row) => String(row.id) === String(invitedId))).toBe(false)
    // The row stays for the audit trail, with the e-mail replaced.
    expect((await admin.query({ text: `SELECT email,ativo FROM app.usuarios_admin WHERE id=$1`, values: [invitedId] })).rows[0]).toEqual({ email: `removido-${invitedId}@removido.invalid`, ativo: false })
    await expect(adminTeamService.setActive(Number(invitedId), true, ownerId)).rejects.toMatchObject({ code: 'ADMIN_NOT_FOUND' })
    await expect(adminTeamService.remove(Number(invitedId), ownerId)).rejects.toMatchObject({ code: 'ADMIN_NOT_FOUND' })
    const again = await adminTeamService.createInvite({ name: 'Volta', email: invitedEmail, role: 'MANAGER', createdBy: ownerId })
    expect(again.invite.email).toBe(invitedEmail)
  })
})
