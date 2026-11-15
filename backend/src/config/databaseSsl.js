import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const backendDirectory = resolve(import.meta.dirname, '../..')

// TLS do PostgreSQL. A validação de cadeia e hostname fica sempre ligada.
// O Supabase assina o certificado do banco com uma CA própria, que não vem no Node:
// informe o PEM em DB_SSL_CA (texto; "\n" literal é aceito) ou o caminho em DB_SSL_CA_FILE
// (relativo à pasta backend/).
export function databaseSsl(source = process.env) {
  if (source.DB_SSL !== true && source.DB_SSL !== 'true') return false

  let ca
  if (source.DB_SSL_CA) {
    ca = String(source.DB_SSL_CA).replace(/\\n/g, '\n')
  } else if (source.DB_SSL_CA_FILE) {
    const file = resolve(backendDirectory, source.DB_SSL_CA_FILE)
    if (!existsSync(file)) {
      throw new Error(`Certificado do banco não encontrado em backend/${source.DB_SSL_CA_FILE}. Baixe-o no Supabase (Database Settings > SSL Configuration).`)
    }
    ca = readFileSync(file, 'utf8')
  }

  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true }
}
