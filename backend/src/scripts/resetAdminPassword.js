// Troca a senha de um acesso ao painel direto pelo terminal (para quando a senha foi esquecida
// e o envio de e-mail ainda não está ligado). A senha digitada não aparece na tela.
// Também destrava o acesso e encerra as sessões abertas desse usuário.
// Uso, na pasta do projeto:  npm run admin:reset-password
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { stdin, stdout } from 'node:process'
import pg from 'pg'
import { databaseSsl } from '../config/databaseSsl.js'
import { resolveAdminConnection } from '../database/adminConnection.js'
import { hashPassword } from '../security/password.js'

const { Client } = pg

// Saída que pode ser "silenciada" enquanto a pessoa digita a senha.
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!output.muted) stdout.write(chunk, encoding)
    callback()
  },
})
// Digitando no terminal: pergunta uma coisa por vez, escondendo a senha. Com as respostas
// vindas de outro programa (uma por linha), lê tudo de uma vez.
const interactive = Boolean(stdin.isTTY)
const terminal = interactive ? createInterface({ input: stdin, output, terminal: true }) : null
let pipedAnswers = null

async function nextPiped() {
  if (!pipedAnswers) {
    let text = ''
    for await (const chunk of stdin) text += chunk
    pipedAnswers = text.split(/\r?\n/)
  }
  return pipedAnswers.shift() ?? ''
}

async function ask(question) {
  if (!interactive) { stdout.write(question + '\n'); return nextPiped() }
  return terminal.question(question)
}

async function askHidden(question) {
  if (!interactive) { stdout.write(question + '\n'); return nextPiped() }
  stdout.write(question)
  output.muted = true
  const answer = await terminal.question('')
  output.muted = false
  stdout.write('\n')
  return answer
}

try {
  const email = (await ask('E-mail do acesso ao painel: ')).trim().toLowerCase()
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('E-mail inválido.')
  const password = await askHidden('Nova senha (mínimo 10 caracteres, não aparece na tela): ')
  if (password.length < 10) throw new Error('A senha deve ter no mínimo 10 caracteres.')
  if (password.length > 200) throw new Error('A senha deve ter no máximo 200 caracteres.')
  if ((await askHidden('Repita a nova senha: ')) !== password) throw new Error('As senhas não são iguais.')

  const { adminUrl } = resolveAdminConnection()
  const client = new Client({ connectionString: adminUrl.toString(), ssl: databaseSsl() })
  await client.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query({
      text: `UPDATE app.usuarios_admin SET password_hash=$2,senha_alterada_em=now(),tentativas_login_falhas=0,bloqueado_ate=NULL,atualizado_em=now() WHERE lower(email)=lower($1) RETURNING id`,
      values: [email, await hashPassword(password)],
    })
    if (!updated.rowCount) throw new Error('Nenhum acesso ao painel com esse e-mail.')
    await client.query({ text: 'UPDATE app.sessoes SET revogada_em=now() WHERE admin_id=$1 AND revogada_em IS NULL', values: [updated.rows[0].id] })
    await client.query('COMMIT')
    stdout.write('Senha trocada. Entre no painel com o e-mail e a nova senha.\n')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
} catch (error) {
  stdout.write(`ERRO: ${error.message}\n`)
  process.exitCode = 1
} finally {
  terminal?.close()
}
