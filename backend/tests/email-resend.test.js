import { describe, expect, it, vi } from 'vitest'
import { createResendEmailProvider } from '../src/providers/emailProvider.js'
import { renderEmail } from '../src/providers/emailTemplates.js'

const config = {
  RESEND_API_KEY: 're_test_only',
  EMAIL_FROM: 'RustiCerrado <pedidos@brincosdeprincesa.com.br>',
  EMAIL_REPLY_TO: 'loja@example.com',
  PUBLIC_FRONTEND_URL: 'https://www.brincosdeprincesa.com.br',
  EXTERNAL_REQUEST_TIMEOUT_MS: 4000,
}
const provider = (response = { ok: true }) => {
  const fetchImpl = vi.fn(async () => response)
  return { fetchImpl, email: createResendEmailProvider({ fetchImpl, config }) }
}

describe('emails sent through Resend', () => {
  it('sends the order email with sender, reply address and the outbox key against duplicates', async () => {
    const { fetchImpl, email } = provider()
    await email.send({ template: 'order-received', to: 'cliente@example.com', variables: { code: 'BDP-123', total: '89.90' }, idempotencyKey: 'order-received:7' })
    const [url, request] = fetchImpl.mock.calls[0]
    const body = JSON.parse(request.body)
    expect(url).toBe('https://api.resend.com/emails')
    expect(request.headers).toMatchObject({ Authorization: 'Bearer re_test_only', 'Idempotency-Key': 'order-received:7' })
    expect(body).toMatchObject({ from: config.EMAIL_FROM, to: ['cliente@example.com'], reply_to: 'loja@example.com', subject: 'Recebemos seu pedido BDP-123' })
    expect(body.text).toMatch(/R\$\s89,90/)
    expect(body.html).toContain('https://www.brincosdeprincesa.com.br/minha-conta')
  })

  it('tells the customer the order was shipped, with the tracking code and link', async () => {
    const withLink = renderEmail('order-shipped', { code: 'BDP-9', trackingCode: 'AA123456789BR', trackingUrl: 'https://rastreio.example/AA123456789BR' }, { siteUrl: config.PUBLIC_FRONTEND_URL })
    expect(withLink.subject).toBe('Seu pedido BDP-9 foi enviado')
    expect(withLink.text).toContain('AA123456789BR')
    expect(withLink.html).toContain('href="https://rastreio.example/AA123456789BR"')
    const withoutLink = renderEmail('order-shipped', { code: 'BDP-9', trackingCode: 'AA123456789BR' }, { siteUrl: config.PUBLIC_FRONTEND_URL })
    expect(withoutLink.text).toContain('rastreamento.correios.com.br')
    expect(withoutLink.html).toContain('https://www.brincosdeprincesa.com.br/minha-conta')
  })

  it('sends password recovery with the reset link', async () => {
    const { fetchImpl, email } = provider()
    await email.sendPasswordReset({ email: 'cliente@example.com', resetUrl: 'https://www.brincosdeprincesa.com.br/redefinir-senha?token=abc' })
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.subject).toBe('Crie uma nova senha')
    expect(body.html).toContain('redefinir-senha?token=abc')
  })

  it('reports a failure so the outbox tries again later', async () => {
    const { email } = provider({ ok: false, status: 500 })
    await expect(email.send({ template: 'payment-confirmed', to: 'c@example.com', variables: { code: 'X' } })).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_ERROR' })
    const offline = createResendEmailProvider({ fetchImpl: vi.fn(async () => { throw new Error('offline') }), config })
    await expect(offline.send({ template: 'payment-confirmed', to: 'c@example.com', variables: { code: 'X' } })).rejects.toMatchObject({ code: 'EMAIL_PROVIDER_UNAVAILABLE' })
  })

  it('refuses unknown templates without calling Resend', async () => {
    const { fetchImpl, email } = provider()
    await expect(email.send({ template: 'promo', to: 'c@example.com', variables: {} })).rejects.toMatchObject({ code: 'EMAIL_TEMPLATE_INVALID' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})

describe('email texts', () => {
  const site = { siteUrl: 'https://www.brincosdeprincesa.com.br/' }

  it('has a text for every email the store sends', () => {
    for (const [template, variables] of [
      ['order-received', { code: 'A', total: '10.00' }], ['payment-confirmed', { code: 'A' }],
      ['password-reset', { resetUrl: 'https://x' }], ['account-activation', { activationUrl: 'https://x' }],
      ['ops-alert', { title: 'Nova venda paga no site', reference: 'BDP-1' }],
    ]) {
      const email = renderEmail(template, variables, site)
      expect(email.subject.length).toBeGreaterThan(3)
      expect(email.html).toContain('RustiCerrado')
      expect(email.text).toContain('RustiCerrado')
    }
  })

  it('tells the store about a new sale with a link to the panel', () => {
    const email = renderEmail('ops-alert', { title: 'Nova venda paga no site', reference: 'BDP-9' }, site)
    expect(email.subject).toBe('[Loja] Nova venda paga no site')
    expect(email.text).toContain('BDP-9')
    expect(email.html).toContain('https://www.brincosdeprincesa.com.br/admin')
  })

  it('escapes text so nothing can inject HTML', () => {
    const email = renderEmail('ops-alert', { title: '<script>x</script>', reference: '"a"' }, site)
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})
