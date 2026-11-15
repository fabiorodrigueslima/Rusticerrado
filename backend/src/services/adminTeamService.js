import { createHash, randomBytes } from 'node:crypto'
import { adminTeamRepository } from '../repositories/adminTeamRepository.js'
import { hashPassword } from '../security/password.js'
import { AppError } from '../utils/AppError.js'

export const INVITE_HOURS = 48
const hash = (value) => createHash('sha256').update(value).digest('hex')

export function createAdminTeamService(repository = adminTeamRepository) {
  return {
    list: () => repository.list(),
    // The plain token is returned only here, once; the database keeps its hash.
    async createInvite({ name, email, role, createdBy }) {
      const token = randomBytes(32).toString('base64url')
      const invite = await repository.createInvite({ name, email, role, tokenHash: hash(token), createdBy, hours: INVITE_HOURS })
      return { invite, token }
    },
    async inspect(token) {
      const invite = await repository.findInvite(hash(token))
      if (!invite) throw new AppError(410, 'INVITE_INVALID', 'Este convite não é mais válido. Peça um novo convite.')
      return { name: invite.nome, email: invite.email, role: invite.papel, expiresAt: invite.expira_em }
    },
    async accept({ token, password }) {
      const admin = await repository.acceptInvite(hash(token), await hashPassword(password))
      return { id: Number(admin.id), name: admin.nome, email: admin.email, role: admin.papel }
    },
    revokeInvite: (id) => repository.revokeInvite(id),
    setActive: (id, active, actorId) => repository.setActive(id, active, actorId),
    remove: (id, actorId) => repository.remove(id, actorId),
  }
}
export const adminTeamService = createAdminTeamService()
