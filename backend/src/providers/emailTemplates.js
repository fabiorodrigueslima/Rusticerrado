// Text of every transactional email, in Portuguese. Each template returns a subject,
// an HTML body and a plain-text body built only from the variables queued in the outbox.
const BRAND = 'RustiCerrado'

const escapeHtml = (value) => String(value ?? '').replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[char])
const money = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))

// paragraphs: plain strings; action: optional { label, url } shown as a button.
function message({ subject, title, paragraphs, action }) {
  const button = action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(action.url)}" style="background:#701921;color:#ffffff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">${escapeHtml(action.label)}</a></p>`
    : ''
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f7f1ea;font-family:Arial,sans-serif;color:#3b2a2a">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="color:#701921;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;font-size:12px">${BRAND}</p>
<h1 style="color:#4a1016;font-size:24px">${escapeHtml(title)}</h1>
${paragraphs.map((text) => `<p style="line-height:1.6">${escapeHtml(text)}</p>`).join('\n')}
${button}
<p style="margin-top:32px;font-size:12px;color:#8a7a72">${BRAND} · Biojoias artesanais</p>
</div></body></html>`
  const text = [title, '', ...paragraphs, ...(action ? ['', `${action.label}: ${action.url}`] : []), '', BRAND].join('\n')
  return { subject, html, text }
}

export function renderEmail(template, variables, { siteUrl }) {
  const site = siteUrl.replace(/\/$/, '')
  switch (template) {
    case 'order-received':
      return message({
        subject: `Recebemos seu pedido ${variables.code}`,
        title: 'Pedido recebido!',
        paragraphs: [
          `Seu pedido ${variables.code} foi registrado, no total de ${money(variables.total)}.`,
          'Assim que o pagamento for confirmado, enviaremos outro e-mail. Se ainda não concluiu o pagamento, você pode acompanhar pela sua conta.',
        ],
        action: { label: 'Ver meus pedidos', url: `${site}/minha-conta` },
      })
    case 'payment-confirmed':
      return message({
        subject: `Pagamento confirmado: pedido ${variables.code}`,
        title: 'Pagamento confirmado',
        paragraphs: [
          `O pagamento do pedido ${variables.code} foi aprovado. Agora começamos a preparar sua peça com todo o cuidado.`,
          'Avisaremos quando ela for enviada.',
        ],
        action: { label: 'Ver meus pedidos', url: `${site}/minha-conta` },
      })
    case 'order-shipped':
      return message({
        subject: `Seu pedido ${variables.code} foi enviado`,
        title: 'Seu pedido está a caminho!',
        paragraphs: [
          `O pedido ${variables.code} foi enviado.`,
          `Código de rastreio: ${variables.trackingCode}`,
          variables.trackingUrl
            ? 'Use o botão abaixo para acompanhar a entrega.'
            : 'Você pode acompanhar a entrega no site dos Correios (rastreamento.correios.com.br) com o código acima.',
        ],
        action: variables.trackingUrl
          ? { label: 'Acompanhar entrega', url: variables.trackingUrl }
          : { label: 'Ver meus pedidos', url: `${site}/minha-conta` },
      })
    case 'password-reset':
      return message({
        subject: 'Crie uma nova senha',
        title: 'Recuperação de senha',
        paragraphs: [
          'Recebemos um pedido para criar uma nova senha na sua conta. O link vale por pouco tempo.',
          'Se não foi você, ignore este e-mail: sua senha continua a mesma.',
        ],
        action: { label: 'Criar nova senha', url: variables.resetUrl },
      })
    case 'account-activation':
      return message({
        subject: 'Ative sua conta',
        title: 'Ative sua conta',
        paragraphs: ['Clique no botão abaixo para criar sua senha e ativar sua conta na loja.', 'Se não foi você, ignore este e-mail.'],
        action: { label: 'Ativar conta', url: variables.activationUrl },
      })
    case 'ops-alert':
      return message({
        subject: `[Loja] ${variables.title}`,
        title: variables.title,
        paragraphs: [`Referência: ${variables.reference}`, 'Abra o painel para ver os detalhes.'],
        action: { label: 'Abrir o painel', url: `${site}/admin` },
      })
    default:
      return null
  }
}
