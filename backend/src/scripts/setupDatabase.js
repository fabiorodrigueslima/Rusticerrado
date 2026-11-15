// Prepara o banco do RustiCerrado num PostgreSQL na nuvem (Neon; também funciona no Supabase).
// Rode uma vez por banco novo; depois, pode repetir sem risco.
//
// Precisa só de DATABASE_ADMIN_URL em backend/.env: o endereço de conexão do dono do banco
// (no Neon: Connect > endereço "direto", sem "-pooler", usuário neondb_owner). O script:
//   1. cria os papéis rustic_owner (dono das tabelas, sem login) e rustic_app (o que o site usa);
//   2. gera uma senha nova para rustic_app e grava DATABASE_URL em backend/.env;
//   3. cria o schema "app" com tabelas, índices, dados base e permissões mínimas;
//   4. aplica as migrations.
// Se o schema já tiver as tabelas, pula o passo 3 e só aplica migrations pendentes.
// Nenhuma senha é impressa.
import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'
import { cleanDatabaseUrl, databaseSsl } from '../config/databaseSsl.js'
import { databaseName, resolveAdminConnection } from '../database/adminConnection.js'
import { runMigrations } from '../database/migrationRunner.js'

const { Client } = pg
const backendDirectory = resolve(import.meta.dirname, '../..')
const databaseDirectory = resolve(backendDirectory, '../database')
const envFile = resolve(backendDirectory, '.env')
const RUNTIME_ROLE = 'rustic_app'
const OWNER_ROLE = 'rustic_owner'

function fail(message) {
  console.error(`ERRO: ${message}`)
  process.exit(1)
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`
}

// Os arquivos de database/ foram escritos para o psql: linhas que começam com "\" são
// comandos do psql e ficam de fora. O nome do banco local vira o banco atual.
async function readSql(fileName, currentDatabase) {
  const sql = await readFile(resolve(databaseDirectory, fileName), 'utf8')
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('\\'))
    .join('\n')
    .replaceAll('ON DATABASE rusticerrado', `ON DATABASE ${quoteIdentifier(currentDatabase)}`)
}

// No pooler do Supabase o usuário é "<papel>.<ref-do-projeto>"; no Neon é só o nome do papel.
function runtimeUserFor(adminUser) {
  const dot = adminUser.indexOf('.')
  return dot === -1 ? RUNTIME_ROLE : `${RUNTIME_ROLE}${adminUser.slice(dot)}`
}

async function ensureRuntimeUrl(adminUrl) {
  const current = process.env.DATABASE_URL
  if (current) {
    const url = new URL(current)
    if (decodeURIComponent(url.username).split('.')[0] === RUNTIME_ROLE) return { url, password: null }
  }

  const url = new URL(adminUrl)
  url.username = runtimeUserFor(decodeURIComponent(url.username))
  const password = randomBytes(24).toString('hex')
  url.password = password

  const text = await readFile(envFile, 'utf8')
  const line = `DATABASE_URL=${url.toString()}`
  const updated = /^DATABASE_URL=.*$/m.test(text)
    ? text.replace(/^DATABASE_URL=.*$/m, line)
    : `${text.trimEnd()}\n${line}\n`
  await writeFile(envFile, updated)
  process.env.DATABASE_URL = url.toString()
  console.log('DATABASE_URL gravada em backend/.env (usuário rustic_app, senha nova).')
  return { url, password }
}

const rawAdminUrl = process.env.DATABASE_ADMIN_URL
if (!rawAdminUrl || rawAdminUrl.includes('COLE_AQUI') || rawAdminUrl.includes('[YOUR-PASSWORD]')) {
  fail('Cole em DATABASE_ADMIN_URL (backend/.env) o endereço de conexão do banco (no Neon: Connect > endereço direto), com a senha.')
}
const localHosts = new Set(['localhost', '127.0.0.1', '::1'])
// Sem TLS só um banco de teste no próprio computador; na nuvem a conexão é sempre segura.
if (process.env.DB_SSL !== 'true' && !localHosts.has(new URL(rawAdminUrl).hostname)) fail('Use DB_SSL=true em backend/.env: o banco na nuvem exige conexão segura.')

const { password: newRuntimePassword } = await ensureRuntimeUrl(cleanDatabaseUrl(new URL(rawAdminUrl)))
const { adminUrl, runtimeUrl } = resolveAdminConnection()

const client = new Client({
  connectionString: adminUrl.toString(),
  application_name: 'rusticerrado-setup',
  ssl: databaseSsl(),
})

await client.connect()
try {
  const identity = await client.query('SELECT current_database() AS database, current_user AS database_user, version() AS version')
  const { database } = identity.rows[0]
  if (database !== databaseName(adminUrl)) fail('Conectou em um banco diferente do informado.')
  console.log(`Conectado: banco ${database}, usuário ${identity.rows[0].database_user}.`)
  const db = quoteIdentifier(database)

  console.log('1/4 Papéis do banco...')
  const owner = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [OWNER_ROLE])
  if (owner.rowCount === 0) {
    await client.query(`CREATE ROLE ${OWNER_ROLE} NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`)
  }
  // O dono do banco (neondb_owner no Neon) precisa poder agir como dono das tabelas (SET ROLE).
  await client.query(`GRANT ${OWNER_ROLE} TO CURRENT_USER`)

  const runtime = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [RUNTIME_ROLE])
  if (runtime.rowCount === 0) {
    // Papel novo: usa a senha recém-gerada ou a que já está em DATABASE_URL.
    const password = newRuntimePassword ?? decodeURIComponent(runtimeUrl.password)
    if (!password) fail('DATABASE_URL está sem senha. Apague a linha DATABASE_URL de backend/.env e rode de novo.')
    await client.query(`CREATE ROLE ${RUNTIME_ROLE} LOGIN PASSWORD ${client.escapeLiteral(password)} NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`)
  } else if (newRuntimePassword) {
    await client.query(`ALTER ROLE ${RUNTIME_ROLE} WITH PASSWORD ${client.escapeLiteral(newRuntimePassword)}`)
  }
  await client.query(`GRANT CONNECT ON DATABASE ${db} TO ${RUNTIME_ROLE}`)

  console.log('2/4 Schema app...')
  await client.query(`CREATE SCHEMA IF NOT EXISTS app AUTHORIZATION ${OWNER_ROLE}`)
  await client.query(`GRANT USAGE ON SCHEMA app TO ${RUNTIME_ROLE}`)
  await client.query(`ALTER ROLE ${RUNTIME_ROLE} IN DATABASE ${db} SET search_path = app, public`)
  await client.query(`ALTER ROLE ${RUNTIME_ROLE} IN DATABASE ${db} SET statement_timeout = '10s'`)
  await client.query(`ALTER ROLE ${RUNTIME_ROLE} IN DATABASE ${db} SET lock_timeout = '3s'`)

  const existing = await client.query("SELECT to_regclass('app.usuarios_admin') IS NOT NULL AS ready")
  if (existing.rows[0].ready) {
    console.log('3/4 Tabelas já existem: nada a recriar.')
  } else {
    console.log('3/4 Tabelas, índices, dados base e permissões...')
    await client.query('BEGIN')
    try {
      for (const file of ['tables.sql', 'indexes.sql', 'seed.sql', 'permissions.sql']) {
        await client.query(await readSql(file, database))
      }
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }

  console.log('4/4 Migrations...')
  const result = await runMigrations({ client, directory: resolve(databaseDirectory, 'migrations') })
  console.log({ event: 'DATABASE_SETUP_COMPLETE', database, applied: result.applied, skipped: result.skipped, pending: result.pending })
  console.log('Banco pronto.')
} finally {
  await client.end()
}
