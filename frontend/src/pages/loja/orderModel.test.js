import { describe, expect, it } from 'vitest'
import { canPollOrder, formatPostalCode, orderStatusLabel, paymentMethodLabel, paymentStatusLabel } from './orderModel.js'

describe('public order states', () => {
  it('uses honest labels for pending, approved and failed/cancelled states', () => { expect(orderStatusLabel.PENDING_PAYMENT).toBe('Aguardando pagamento'); expect(orderStatusLabel.PAID).toBe('Pagamento confirmado'); expect(orderStatusLabel.CANCELLED).toBe('Cancelado') })
  it('allows future controlled polling only while payment is pending', () => { expect(canPollOrder('PENDING_PAYMENT')).toBe(true); expect(canPollOrder('PAID')).toBe(false); expect(canPollOrder('CANCELLED')).toBe(false) })

  it('labels every payment/order state exposed by the backend', () => {
    expect(orderStatusLabel).toMatchObject({
      PENDING_PAYMENT: 'Aguardando pagamento',
      PAID: 'Pagamento confirmado',
      CANCELLED: 'Cancelado',
      REFUNDED: 'Reembolsado',
      CHARGEBACK: 'Pagamento contestado — em análise',
    })
  })
})

describe('customer-facing payment details', () => {
  it('never shows raw backend codes to the customer', () => {
    for (const code of ['PENDING', 'AUTHORIZED', 'APPROVED', 'DECLINED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK']) expect(paymentStatusLabel[code]).toMatch(/^[a-zçãé ]+$/)
    expect(paymentMethodLabel).toEqual({ PIX: 'Pix', CARD: 'Cartão' })
    expect(formatPostalCode('01001000')).toBe('01001-000')
  })
})
