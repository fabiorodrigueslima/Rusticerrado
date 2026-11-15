import { query, transaction } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export function createAdminAuthRepository(db = query, tx = transaction) {
  return {
    // A new link replaces any previous unused one, so only the latest e-mail works.
    async createReset(adminId, tokenHash) {
      await tx(async (client) => {
        await client.query({ text: `UPDATE app.password_reset_tokens SET usado_em=now() WHERE admin_id=$1 AND usado_em IS NULL`, values: [adminId] });
        await client.query({ text: `INSERT INTO app.password_reset_tokens(admin_id,token_hash,expira_em) VALUES($1,$2,now()+interval '30 minutes')`, values: [adminId, tokenHash] });
      });
    },
    // Sets the new password, clears lockouts and ends every open session of that administrator.
    async consumeReset(tokenHash, passwordHash) {
      return tx(async (client) => {
        const found = await client.query({
          text: `SELECT t.id,t.admin_id FROM app.password_reset_tokens t JOIN app.usuarios_admin u ON u.id=t.admin_id WHERE t.token_hash=$1 AND t.usado_em IS NULL AND t.expira_em>now() AND u.ativo FOR UPDATE OF t`,
          values: [tokenHash],
        });
        if (!found.rowCount) throw new AppError(400, "RESET_TOKEN_INVALID", "Link de redefinição inválido ou expirado. Peça um novo.");
        const { id, admin_id: adminId } = found.rows[0];
        await client.query({ text: `UPDATE app.password_reset_tokens SET usado_em=now() WHERE id=$1`, values: [id] });
        await client.query({
          text: `UPDATE app.usuarios_admin SET password_hash=$2,senha_alterada_em=now(),tentativas_login_falhas=0,bloqueado_ate=NULL,atualizado_em=now() WHERE id=$1`,
          values: [adminId, passwordHash],
        });
        await client.query({ text: `UPDATE app.sessoes SET revogada_em=now() WHERE admin_id=$1 AND revogada_em IS NULL`, values: [adminId] });
        await client.query({ text: `DELETE FROM app.login_throttle WHERE escopo='ADMIN' AND conta_id=$1`, values: [adminId] });
        return Number(adminId);
      });
    },
    async findByEmail(email) {
      const result = await db({
        text: `SELECT id,email,nome,password_hash,papel,ativo,tentativas_login_falhas,bloqueado_ate FROM app.usuarios_admin WHERE lower(email)=lower($1)`,
        values: [email],
      });
      return result.rows[0] ?? null;
    },
    async recordFailure(id) {
      await db({
        text: `UPDATE app.usuarios_admin SET tentativas_login_falhas=tentativas_login_falhas+1,bloqueado_ate=CASE WHEN tentativas_login_falhas+1>=5 THEN now()+interval '15 minutes' ELSE bloqueado_ate END WHERE id=$1`,
        values: [id],
      });
    },
    async recordSuccess(id) {
      await db({
        text: `UPDATE app.usuarios_admin SET tentativas_login_falhas=0,bloqueado_ate=NULL,ultimo_login_em=now() WHERE id=$1`,
        values: [id],
      });
    },
    async createSession(
      adminId,
      tokenHash,
      csrfHash,
      ipHash,
      userAgentHash,
      hours,
    ) {
      await db({
        text: `INSERT INTO app.sessoes(admin_id,token_hash,csrf_secret_hash,ip_hash,user_agent_hash,expira_em) VALUES($1,$2,$3,$4,$5,now()+($6||' hours')::interval)`,
        values: [adminId, tokenHash, csrfHash, ipHash, userAgentHash, hours],
      });
    },
    async findSession(tokenHash) {
      const result = await db({
        text: `SELECT s.id,s.admin_id,s.csrf_secret_hash,s.expira_em,u.email,u.nome,u.papel,u.ativo FROM app.sessoes s JOIN app.usuarios_admin u ON u.id=s.admin_id WHERE s.token_hash=$1 AND s.revogada_em IS NULL AND s.expira_em>now()`,
        values: [tokenHash],
      });
      return result.rows[0] ?? null;
    },
    async revoke(tokenHash) {
      await db({
        text: `UPDATE app.sessoes SET revogada_em=now() WHERE token_hash=$1 AND revogada_em IS NULL`,
        values: [tokenHash],
      });
    },
    async rotateCsrf(id, csrfHash) {
      await db({
        text: `UPDATE app.sessoes SET csrf_secret_hash=$1,ultimo_uso_em=now() WHERE id=$2`,
        values: [csrfHash, id],
      });
    },
    async audit({
      adminId = null,
      action,
      resourceType = null,
      resourceId = null,
      result = "SUCCESS",
      requestId,
      metadata = {},
    }) {
      await db({
        text: `INSERT INTO app.audit_logs(admin_id,acao,tipo_recurso,recurso_id,resultado,request_id,metadados) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        values: [
          adminId,
          action,
          resourceType,
          resourceId,
          result,
          requestId,
          metadata,
        ],
      });
    },
  };
}
export const adminAuthRepository = createAdminAuthRepository();
