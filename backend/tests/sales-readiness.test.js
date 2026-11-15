import { describe, expect, it } from 'vitest'
import { salesReadiness } from '../src/services/salesReadiness.js'
import { settingSchema } from '../src/validators/adminValidators.js'

const configured = { SITE_MODE: 'commerce', PAYMENT_PROVIDER: 'mercado-pago', MERCADO_PAGO_ACCESS_TOKEN: 'APP_USR-test', SHIPPING_PROVIDER: 'configurable', EMAIL_PROVIDER: 'resend' }

describe('online sales switch', () => {
  it('can be turned on only when payment, shipping and email are configured', () => {
    expect(salesReadiness(configured)).toEqual({ ready: true, missing: [] })
  })

  it('accepts a Mercado Pago account connected in the panel instead of a fixed token', () => {
    const withoutToken = { ...configured, MERCADO_PAGO_ACCESS_TOKEN: undefined }
    expect(salesReadiness(withoutToken).missing).toEqual(['Pagamento: conecte a conta do Mercado Pago em Configurações → Pagamentos.'])
    expect(salesReadiness(withoutToken, { paymentConnected: true })).toEqual({ ready: true, missing: [] })
  })

  it('lists in plain words what is still missing', () => {
    const { ready, missing } = salesReadiness({ ...configured, SITE_MODE: 'catalog', PAYMENT_PROVIDER: 'disabled', EMAIL_PROVIDER: 'disabled' })
    expect(ready).toBe(false)
    expect(missing).toEqual([
      'O site está em modo catálogo (SITE_MODE=catalog na hospedagem).',
      'Pagamento: Mercado Pago não configurado.',
      'Envio de e-mails não configurado.',
    ])
  })

  it('accepts the switch or the reservation time, and rejects an empty change', () => {
    expect(settingSchema.parse({ checkoutEnabled: true })).toEqual({ checkoutEnabled: true })
    expect(settingSchema.parse({ reservationMinutes: 30 })).toEqual({ reservationMinutes: 30 })
    expect(settingSchema.safeParse({}).success).toBe(false)
    expect(settingSchema.safeParse({ checkoutEnabled: 'sim' }).success).toBe(false)
  })
})
