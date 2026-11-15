export const orderStatusLabel = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pagamento confirmado',
  CANCELLED: 'Cancelado',
  IN_PRODUCTION: 'Em produção',
  READY_TO_SHIP: 'Pronto para envio',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  REFUNDED: 'Reembolsado',
  CHARGEBACK: 'Pagamento contestado — em análise',
}

export const canPollOrder = (status) => status === 'PENDING_PAYMENT'

// Payment attempt states and methods as stored by the backend, shown to the customer.
export const paymentStatusLabel = {
  PENDING: 'aguardando confirmação',
  AUTHORIZED: 'autorizado',
  APPROVED: 'aprovado',
  DECLINED: 'recusado',
  CANCELLED: 'cancelado',
  REFUNDED: 'estornado',
  CHARGEBACK: 'contestado',
}
export const paymentMethodLabel = { PIX: 'Pix', CARD: 'Cartão' }
export const formatPostalCode = (value = '') => String(value).replace(/\D/g, '').replace(/^(\d{5})(\d{3})$/, '$1-$2')
