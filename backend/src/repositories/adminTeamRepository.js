import { query, transaction } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

const pending = `usado_em IS NULL AND revogado_em IS NULL`;
// Removed administrators keep their row (audit history points to it) but their e-mail is
// replaced by this placeholder, which frees the address for a future invite.
const REMOVED_DOMAIN = "@removido.invalid";
const invalidInvite = () => new AppError(410, "INVITE_INVALID", "Este convite não é mais válido. Peça um novo convite.");

export function createAdminTeamRepository(db = query, tx = transaction) {
  return {
    async list() {
      const [admins, invites] = await Promise.all([
        db({ text: `SELECT id,email,nome,papel,ativo,ultimo_login_em,criado_em FROM app.usuarios_admin WHERE email NOT LIKE $1 ORDER BY criado_em,id`, values: [`%${REMOVED_DOMAIN}`] }),
        db(`SELECT id,email,nome,papel,criado_em,expira_em FROM app.admin_convites WHERE ${pending} AND expira_em>now() ORDER BY criado_em DESC`),
      ]);
      return { admins: admins.rows, invites: invites.rows };
    },
    async createInvite({ email, name, role, tokenHash, createdBy, hours }) {
      return tx(async (client) => {
        const existing = await client.query({ text: `SELECT id FROM app.usuarios_admin WHERE lower(email)=lower($1)`, values: [email] });
        if (existing.rowCount) throw new AppError(409, "ADMIN_EXISTS", "Já existe um administrador com este e-mail.");
        // An expired invite must not block a new one for the same e-mail.
        await client.query({ text: `UPDATE app.admin_convites SET revogado_em=now() WHERE lower(email)=lower($1) AND ${pending} AND expira_em<=now()`, values: [email] });
        const open = await client.query({ text: `SELECT id FROM app.admin_convites WHERE lower(email)=lower($1) AND ${pending}`, values: [email] });
        if (open.rowCount) throw new AppError(409, "INVITE_PENDING", "Já existe um convite pendente para este e-mail. Cancele o anterior para gerar outro.");
        const result = await client.query({
          text: `INSERT INTO app.admin_convites(email,nome,papel,token_hash,criado_por,expira_em) VALUES($1,$2,$3,$4,$5,now()+($6||' hours')::interval) RETURNING id,email,nome,papel,criado_em,expira_em`,
          values: [email, name, role, tokenHash, createdBy, hours],
        });
        return result.rows[0];
      });
    },
    async findInvite(tokenHash) {
      const result = await db({ text: `SELECT id,email,nome,papel,expira_em FROM app.admin_convites WHERE token_hash=$1 AND ${pending} AND expira_em>now()`, values: [tokenHash] });
      return result.rows[0] ?? null;
    },
    // The invite is locked and consumed in the same transaction that creates the account,
    // so a link opened twice at the same time creates at most one administrator.
    async acceptInvite(tokenHash, passwordHash) {
      return tx(async (client) => {
        const found = await client.query({ text: `SELECT id,email,nome,papel FROM app.admin_convites WHERE token_hash=$1 AND ${pending} AND expira_em>now() FOR UPDATE`, values: [tokenHash] });
        const invite = found.rows[0];
        if (!invite) throw invalidInvite();
        const existing = await client.query({ text: `SELECT id FROM app.usuarios_admin WHERE lower(email)=lower($1)`, values: [invite.email] });
        if (existing.rowCount) throw new AppError(409, "ADMIN_EXISTS", "Já existe um administrador com este e-mail. Entre pelo painel.");
        const created = await client.query({ text: `INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,$2,$3,$4) RETURNING id,email,nome,papel`, values: [invite.email, invite.nome, passwordHash, invite.papel] });
        await client.query({ text: `UPDATE app.admin_convites SET usado_em=now(),usuario_id=$2 WHERE id=$1`, values: [invite.id, created.rows[0].id] });
        return created.rows[0];
      });
    },
    async revokeInvite(id) {
      const result = await db({ text: `UPDATE app.admin_convites SET revogado_em=now() WHERE id=$1 AND ${pending} RETURNING id`, values: [id] });
      if (!result.rowCount) throw new AppError(404, "INVITE_NOT_FOUND", "Convite não encontrado ou já utilizado.");
      return result.rows[0];
    },
    async setActive(id, active, actorId) {
      return tx(async (client) => {
        const found = await client.query({ text: `SELECT id,papel,ativo,email FROM app.usuarios_admin WHERE id=$1 FOR UPDATE`, values: [id] });
        const admin = found.rows[0];
        // A removed administrator cannot be brought back; a new invite is required.
        if (!admin || admin.email.endsWith(REMOVED_DOMAIN)) throw new AppError(404, "ADMIN_NOT_FOUND", "Administrador não encontrado.");
        if (!active && String(id) === String(actorId)) throw new AppError(409, "CANNOT_DEACTIVATE_SELF", "Você não pode desativar o seu próprio acesso.");
        if (!active && admin.papel === "OWNER") {
          const owners = await client.query({ text: `SELECT count(*)::integer total FROM app.usuarios_admin WHERE papel='OWNER' AND ativo AND id<>$1`, values: [id] });
          if (!owners.rows[0].total) throw new AppError(409, "LAST_OWNER", "A loja precisa de pelo menos um dono ativo.");
        }
        await client.query({ text: `UPDATE app.usuarios_admin SET ativo=$2 WHERE id=$1`, values: [id, active] });
        // Deactivation takes effect immediately: open sessions stop working.
        if (!active) await client.query({ text: `UPDATE app.sessoes SET revogada_em=now() WHERE admin_id=$1 AND revogada_em IS NULL`, values: [id] });
        return { id, ativo: active };
      });
    },
    async remove(id, actorId) {
      return tx(async (client) => {
        const found = await client.query({ text: `SELECT id,ativo,email FROM app.usuarios_admin WHERE id=$1 FOR UPDATE`, values: [id] });
        const admin = found.rows[0];
        if (!admin || admin.email.endsWith(REMOVED_DOMAIN)) throw new AppError(404, "ADMIN_NOT_FOUND", "Administrador não encontrado.");
        if (String(id) === String(actorId)) throw new AppError(409, "CANNOT_REMOVE_SELF", "Você não pode remover o seu próprio acesso.");
        if (admin.ativo) throw new AppError(409, "ADMIN_STILL_ACTIVE", "Desative o acesso antes de remover.");
        await client.query({ text: `UPDATE app.usuarios_admin SET email=$2 WHERE id=$1`, values: [id, `removido-${id}${REMOVED_DOMAIN}`] });
        await client.query({ text: `UPDATE app.sessoes SET revogada_em=now() WHERE admin_id=$1 AND revogada_em IS NULL`, values: [id] });
        return { id, removido: true };
      });
    },
  };
}
export const adminTeamRepository = createAdminTeamRepository();
