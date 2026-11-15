import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// TLS do PostgreSQL. A validação de cadeia e hostname fica sempre ligada.
// O Supabase assina o certificado do banco com uma CA própria, que não vem no Node:
// informe o PEM em DB_SSL_CA (texto; "\n" literal é aceito) ou o caminho em DB_SSL_CA_FILE
// (relativo à pasta onde o servidor roda: backend/ no computador). No Netlify use DB_SSL_CA.
// Não usar import.meta aqui: no Netlify a função é empacotada como CommonJS e ele vira {}.
export function databaseSsl(source = process.env) {
  if (source.DB_SSL !== true && source.DB_SSL !== 'true') return false

  let ca
  if (source.DB_SSL_CA) {
    ca = String(source.DB_SSL_CA).replace(/\\n/g, '\n')
  } else if (source.DB_SSL_CA_FILE) {
    const file = resolve(process.cwd(), source.DB_SSL_CA_FILE)
    if (!existsSync(file)) {
      throw new Error(`Certificado do banco não encontrado em backend/${source.DB_SSL_CA_FILE}. Baixe-o no Supabase (Database Settings > SSL Configuration).`)
    }
    ca = readFileSync(file, 'utf8')
  }

  return ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true }
}

// Os endereços copiados do Neon (e de outros provedores) terminam com ?sslmode=require&
// channel_binding=require. A segurança da conexão já é decidida por DB_SSL (sempre validando
// o certificado), então esses parâmetros saem para não brigar com a configuração acima.
const TLS_PARAMS = ['sslmode', 'channel_binding', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword', 'uselibpqcompat']

export function cleanDatabaseUrl(value) {
  if (!value) return value
  const url = value instanceof URL ? new URL(value) : new URL(String(value))
  for (const param of TLS_PARAMS) url.searchParams.delete(param)
  return value instanceof URL ? url : url.toString()
}
