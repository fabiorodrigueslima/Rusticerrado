import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const databaseDirectory = resolve(import.meta.dirname, '../../database')

async function readSql(fileName) {
  return readFile(resolve(databaseDirectory, fileName), 'utf8')
}

describe('manual PostgreSQL schema', () => {
  it('contains all mandatory SQL files', async () => {
    await expect(Promise.all([
      readSql('database.sql'),
      readSql('tables.sql'),
      readSql('indexes.sql'),
      readSql('seed.sql'),
      readSql('permissions.sql'),
      readSql('verify.sql'),
      readSql('migrations/001_baseline.sql'),
      readSql('migrations/004_orders_payments.sql'),
      readSql('migrations/005_admin_security.sql'),
    ])).resolves.toHaveLength(9)
  })

  it('defines every mandatory table', async () => {
    const sql = await readSql('tables.sql')
    const mandatoryTables = [
      'usuarios_admin', 'clientes', 'enderecos', 'categorias', 'colecoes',
      'produtos', 'produto_variantes', 'produto_imagens', 'pedidos',
      'pedido_itens', 'pagamentos', 'cupons', 'cupom_utilizacoes',
      'webhook_eventos', 'sessoes', 'password_reset_tokens', 'audit_logs',
    ]

    for (const table of mandatoryTables) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`))
    }
  })

  it('uses decimal money and has no card-secret columns', async () => {
    const sql = (await readSql('tables.sql')).toLowerCase()
    expect(sql).toContain('numeric(12,2)')
    expect(sql).not.toMatch(/\b(float|real|double precision)\b/)
    expect(sql).not.toMatch(/\b(cvv|numero_cartao|card_number|pan_completo)\b/)
  })

  it('revalidates existing checkout and future order structures', async () => {
    const sql = await readSql('tables.sql')
    for (const table of ['clientes', 'enderecos', 'pedidos', 'pedido_itens', 'reservas_estoque', 'configuracoes']) {
      expect(sql).toMatch(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`))
    }
    expect(sql).toContain("enderecos_cep_formato CHECK (cep ~ '^[0-9]{5}-?[0-9]{3}$')")
    expect(sql).toContain('pedidos_total_coerente CHECK (total = subtotal - desconto + frete)')
  })

  it('does not seed credentials or grant broad runtime access', async () => {
    const seed = (await readSql('seed.sql')).toLowerCase()
    const tables = (await readSql('tables.sql')).replace(/\s+/g, ' ')
    const permissions = (await readSql('permissions.sql')).replace(/\s+/g, ' ')

    expect(seed).not.toContain('insert into usuarios_admin')
    expect(seed).not.toMatch(/password|secret|token/)
    expect(tables).not.toMatch(/GRANT SELECT, INSERT, UPDATE, DELETE/i)
    expect(tables).not.toMatch(/GRANT USAGE, SELECT ON ALL SEQUENCES/i)
    expect(tables).toContain('GRANT SELECT ON app.categorias, app.colecoes, app.produtos, app.produto_variantes, app.produto_imagens, app.produto_colecoes TO rustic_app;')
    expect(permissions).toContain('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA app FROM rustic_app;')
    expect(permissions).toContain('REVOKE TEMPORARY ON DATABASE rusticerrado FROM rustic_app;')
  })

  it('defines immutable migrations', async () => {
    const baseline = await readSql('migrations/001_baseline.sql')

    expect(baseline).toContain("table_name <> 'schema_migrations'")
    expect(baseline).not.toMatch(/DROP\s+(TABLE|SCHEMA|DATABASE)/i)
  })
})
