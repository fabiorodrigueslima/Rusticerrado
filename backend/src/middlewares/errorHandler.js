import { env } from "../config/env.js";

// Constraint violations caused by the request data (duplicate slug/SKU, missing
// related record) are client errors, not server failures.
const databaseErrors = {
  23505: { status: 409, code: 'DUPLICATE_VALUE', message: 'Já existe um registro com estes dados (por exemplo, slug ou SKU repetido).' },
  23503: { status: 409, code: 'RELATED_RECORD_INVALID', message: 'O registro relacionado não existe ou ainda está em uso.' },
}

export function errorHandler(rawError, req, res, _next) {
  void _next
  const mapped = !rawError.status && databaseErrors[rawError.code]
  const error = mapped ? { ...mapped, name: rawError.name } : rawError
  if (!error.status && /^[0-9A-Z]{5}$/.test(String(error.code ?? ''))) error.code = undefined
  const isCorsError = error.message === 'Origem não autorizada'
  const isDatabaseUnavailable = error.message === 'DATABASE_NOT_CONFIGURED'
  const status = error.status ?? (isCorsError ? 403 : isDatabaseUnavailable ? 503 : 500)
  const code = error.code ?? (isCorsError ? 'ORIGIN_NOT_ALLOWED' : isDatabaseUnavailable ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR')
  const message = error.status
    ? error.message
    : isCorsError
      ? 'Origem não autorizada.'
      : isDatabaseUnavailable
        ? 'Catálogo temporariamente indisponível.'
        : 'Não foi possível concluir a solicitação.'

  if (status === 500) {
    console.error({
      event: 'UNHANDLED_ERROR',
      requestId: req.requestId,
      errorName: error.name,
      ...(env.NODE_ENV === 'development'
        ? { errorMessage: error.message, errorStack: error.stack }
        : {}),
    })
  }

  res.status(status).json({
    error: {
      code,
      message,
      requestId: req.requestId,
      ...(error.details ? { details: error.details } : {}),
    },
  })
}
