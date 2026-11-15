import { randomUUID } from 'node:crypto'
import pg from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Runs as the site's own database user (rustic_app), as in production, to prove what it
// can NOT do even if the application were compromised.
let admin, runtime, adminId
const email = `privilegio-${randomUUID()}@example.invalid`

beforeAll(async () => {
  admin = new pg.Client({ connectionString: process.env.TEST_DATABASE_ADMIN_URL })
  runtime = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL })
  await admin.connect()
  await runtime.connect()
  adminId = (await admin.query({ text: `INSERT INTO app.usuarios_admin(email,nome,password_hash,papel) VALUES($1,'Privilégio','x','FULFILLMENT') RETURNING id`, values: [email] })).rows[0].id
  await admin.query({ text: `INSERT INTO app.audit_logs(admin_id,acao,resultado) VALUES($1,'PRIVILEGE_TEST','SUCCESS')`, values: [adminId] })
})
afterAll(async () => {
  await runtime?.end()
  if (!admin) return
  await admin.query({ text: 'DELETE FROM app.audit_logs WHERE admin_id=$1', values: [adminId] })
  await admin.query({ text: 'DELETE FROM app.usuarios_admin WHERE id=$1', values: [adminId] })
  await admin.end()
})

const denied = (sql, values) => expect(runtime.query({ text: sql, values })).rejects.toMatchObject({ code: '42501' })

describe('site database user has only the privileges it needs', () => {
  it('cannot rewrite or erase audit trails, stock movements or order history', async () => {
    await denied(`UPDATE app.audit_logs SET acao='APAGADO' WHERE admin_id=$1`, [adminId])
    await denied(`DELETE FROM app.audit_logs WHERE admin_id=$1`, [adminId])
    await denied(`UPDATE app.movimentos_estoque SET quantidade=0 WHERE id=-1`, [])
    await denied(`UPDATE app.pedido_status_historico SET motivo='x' WHERE id=-1`, [])
    // Adding new audit entries keeps working.
    const added = await runtime.query({ text: `INSERT INTO app.audit_logs(admin_id,acao,resultado) VALUES($1,'PRIVILEGE_TEST','SUCCESS') RETURNING id`, values: [adminId] })
    expect(added.rowCount).toBe(1)
  })

  it('cannot promote an administrator, but still handles login, lockouts and passwords', async () => {
    await denied(`UPDATE app.usuarios_admin SET papel='OWNER' WHERE id=$1`, [adminId])
    await denied(`UPDATE app.usuarios_admin SET nome='Outro' WHERE id=$1`, [adminId])
    const allowed = await runtime.query({ text: `UPDATE app.usuarios_admin SET tentativas_login_falhas=0,bloqueado_ate=NULL,ultimo_login_em=now(),password_hash='y',senha_alterada_em=now(),ativo=TRUE WHERE id=$1`, values: [adminId] })
    expect(allowed.rowCount).toBe(1)
    expect((await admin.query({ text: 'SELECT papel FROM app.usuarios_admin WHERE id=$1', values: [adminId] })).rows[0].papel).toBe('FULFILLMENT')
  })

  it('cannot create tables, read the migration history or drop data in bulk', async () => {
    await denied(`CREATE TABLE app.invasao(id int)`, [])
    await denied(`SELECT * FROM app.schema_migrations`, [])
    await denied(`TRUNCATE app.pedidos`, [])
    await denied(`DELETE FROM app.pedidos WHERE id=-1`, [])
  })
})
