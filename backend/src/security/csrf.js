import { createHmac } from 'node:crypto'

// The CSRF token is derived from the httpOnly session token, so every tab of the same
// session receives the same value and no tab invalidates another. A cross-site attacker
// cannot read the session cookie and therefore cannot compute the token. The purpose
// keeps admin and customer tokens distinct even for equal session secrets.
export const deriveCsrf = (sessionToken, purpose) =>
  createHmac('sha256', sessionToken).update(`bdp-csrf:${purpose}:v1`).digest('base64url')
