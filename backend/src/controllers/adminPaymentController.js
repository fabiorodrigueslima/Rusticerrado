import { env } from '../config/env.js'
import { adminAuthRepository } from '../repositories/adminAuthRepository.js'
import { settingsRepository } from '../repositories/settingsRepository.js'
import { paymentConnectionService } from '../services/paymentConnectionService.js'

const panelUrl = (result) => `${(env.PUBLIC_FRONTEND_URL ?? 'http://localhost:5173').replace(/\/$/, '')}/admin?pagamentos=${result}`

export async function paymentSettings(_req, res) {
  res.json({ data: { connection: await paymentConnectionService.status(), methods: await settingsRepository.getPaymentMethods() } })
}

export async function startMercadoPagoConnection(req, res) {
  const data = await paymentConnectionService.startAuthorization(req.admin.admin_id)
  await adminAuthRepository.audit({ adminId: req.admin.admin_id, action: 'PAYMENT_CONNECT_START', resourceType: 'PAYMENT_CONNECTION', resourceId: 'mercado-pago', requestId: req.requestId })
  res.json({ data })
}

// Mercado Pago redirects the browser here (no admin cookie on this cross-site redirect: the
// single-use state identifies the administrator). Always ends on the panel, never shows JSON.
export async function mercadoPagoCallback(req, res) {
  const { code, state, error } = req.query
  const valid = typeof code === 'string' && /^[\w-]{1,512}$/.test(code) && typeof state === 'string' && /^[A-Za-z0-9_-]{43}$/.test(state)
  if (error || !valid) return res.redirect(303, panelUrl(error === 'access_denied' ? 'cancelado' : 'erro'))
  try {
    const { adminId } = await paymentConnectionService.completeAuthorization({ code, state })
    await adminAuthRepository.audit({ adminId, action: 'PAYMENT_CONNECT', resourceType: 'PAYMENT_CONNECTION', resourceId: 'mercado-pago', requestId: req.requestId })
    return res.redirect(303, panelUrl('conectado'))
  } catch (failure) {
    console.error(JSON.stringify({ event: 'PAYMENT_CONNECT_FAILED', code: failure.code ?? 'ERROR', requestId: req.requestId }))
    return res.redirect(303, panelUrl('erro'))
  }
}

export async function disconnectMercadoPago(req, res) {
  const data = await paymentConnectionService.disconnect()
  await adminAuthRepository.audit({ adminId: req.admin.admin_id, action: 'PAYMENT_DISCONNECT', resourceType: 'PAYMENT_CONNECTION', resourceId: 'mercado-pago', requestId: req.requestId })
  res.json({ data })
}

export async function updatePaymentMethods(req, res) {
  const data = await settingsRepository.updatePaymentMethods(req.validated.body, req.admin.admin_id)
  await adminAuthRepository.audit({ adminId: req.admin.admin_id, action: 'PAYMENT_METHODS_UPDATE', resourceType: 'SETTINGS', resourceId: 'payments.methods', requestId: req.requestId, metadata: data })
  res.json({ data })
}
