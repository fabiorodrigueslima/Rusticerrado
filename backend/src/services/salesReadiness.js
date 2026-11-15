import { env } from '../config/env.js'
import { paymentConnectionService } from './paymentConnectionService.js'

// What still blocks online sales, in plain words for the panel. The checkout switch can only
// be turned on when this list is empty, so a half-configured store never takes orders.
// paymentConnected: whether a Mercado Pago account is connected in the panel (OAuth).
export function salesReadiness(config = env, { paymentConnected = false } = {}) {
  const missing = []
  if (config.SITE_MODE === 'catalog') missing.push('O site está em modo catálogo (SITE_MODE=catalog na hospedagem).')
  if (config.PAYMENT_PROVIDER === 'disabled') missing.push('Pagamento: Mercado Pago não configurado.')
  else if (!config.MERCADO_PAGO_ACCESS_TOKEN && !paymentConnected) missing.push('Pagamento: conecte a conta do Mercado Pago em Configurações → Pagamentos.')
  if (config.SHIPPING_PROVIDER === 'disabled') missing.push('Frete não configurado.')
  if (config.EMAIL_PROVIDER === 'disabled') missing.push('Envio de e-mails não configurado.')
  return { ready: missing.length === 0, missing }
}

export async function currentSalesReadiness(config = env, connections = paymentConnectionService) {
  const { connected } = await connections.status()
  return salesReadiness(config, { paymentConnected: connected })
}
