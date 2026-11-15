import { resolve } from 'node:path'
import pg from 'pg'
import { databaseSsl } from '../config/databaseSsl.js'
import { resolveAdminConnection } from '../database/adminConnection.js'
import { runMigrations } from '../database/migrationRunner.js'

const { Client } = pg
const migrationsDirectory = resolve(import.meta.dirname, '../../../database/migrations')
const { adminUrl } = resolveAdminConnection()
const client = new Client({
  connectionString: adminUrl.toString(),
  application_name: 'rusticerrado-migrations',
  ssl: databaseSsl(),
})

await client.connect()
try {
  const identity = await client.query('SELECT current_database() AS database, current_user AS database_user')
  const result = await runMigrations({ client, directory: migrationsDirectory })
  console.log({
    event: 'DATABASE_MIGRATIONS_COMPLETE',
    database: identity.rows[0].database,
    databaseUser: identity.rows[0].database_user,
    applied: result.applied,
    skipped: result.skipped,
    pending: result.pending,
  })
} finally {
  await client.end()
}
