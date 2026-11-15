import { query } from '../config/database.js'

const CHECKOUT_ENABLED_KEY = 'checkout.enabled'
const PAYMENT_METHODS_KEY = 'payments.methods'

// Used when the setting row is missing (e.g. before migration 023): the original behavior.
export const DEFAULT_PAYMENT_METHODS = Object.freeze({ pix: true, credit: true, debit: true, boleto: false, maxInstallments: 3 })

export function normalizePaymentMethods(value) {
  const source = value && typeof value === 'object' ? value : {}
  const flag = (key) => (typeof source[key] === 'boolean' ? source[key] : DEFAULT_PAYMENT_METHODS[key])
  const installments = Number(source.maxInstallments)
  return {
    pix: flag('pix'),
    credit: flag('credit'),
    debit: flag('debit'),
    boleto: flag('boleto'),
    maxInstallments: Number.isInteger(installments) && installments >= 1 && installments <= 12 ? installments : DEFAULT_PAYMENT_METHODS.maxInstallments,
  }
}

export function createSettingsRepository(dbQuery = query) {
  return {
    async isCheckoutEnabled({ lock = false } = {}) {
      const result = await dbQuery({
        text: `SELECT valor FROM app.configuracoes WHERE chave=$1${lock ? ' FOR SHARE' : ''}`,
        values: [CHECKOUT_ENABLED_KEY],
      })
      return result.rows[0]?.valor === true
    },
    async getPaymentMethods() {
      const result = await dbQuery({ text: `SELECT valor FROM app.configuracoes WHERE chave=$1`, values: [PAYMENT_METHODS_KEY] })
      return normalizePaymentMethods(result.rows[0]?.valor)
    },
    async updatePaymentMethods(methods, adminId) {
      const value = normalizePaymentMethods(methods)
      // The row is created by migration 023; the runtime role only updates settings.
      const result = await dbQuery({
        text: `UPDATE app.configuracoes SET valor=$2,atualizado_por=$3,atualizado_em=now() WHERE chave=$1`,
        values: [PAYMENT_METHODS_KEY, value, adminId],
      })
      if (!result.rowCount) throw new Error('PAYMENT_METHODS_SETTING_MISSING')
      return value
    },
  }
}

export const settingsRepository = createSettingsRepository()
