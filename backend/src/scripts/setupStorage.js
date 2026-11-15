// Cria (ou atualiza) no Supabase Storage o bucket público das fotos dos produtos:
// só aceita JPG, PNG e WEBP de até 5 MB. Pode rodar quantas vezes quiser.
// Precisa de STORAGE_PROVIDER=supabase, SUPABASE_URL e SUPABASE_SECRET_KEY em backend/.env.
import { env } from '../config/env.js'
import { createSupabaseStorageProvider } from '../providers/storageProvider.js'

if (env.STORAGE_PROVIDER !== 'supabase') {
  console.error('ERRO: use STORAGE_PROVIDER=supabase em backend/.env.')
  process.exit(1)
}

try {
  const result = await createSupabaseStorageProvider().ensureBucket()
  console.log({ event: 'SUPABASE_STORAGE_READY', bucket: result.bucket, created: result.created })
  console.log(result.created ? 'Bucket de fotos criado.' : 'Bucket de fotos já existia: configuração atualizada.')
} catch (error) {
  console.error(`ERRO: ${error.message}`)
  process.exit(1)
}
