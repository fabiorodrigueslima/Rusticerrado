import { useCallback, useState } from 'react'
import { useStorefront } from './storefrontContext.js'

// State for one form's anti-robot check. `ready` is true when the check is off or solved;
// `reset()` after each submit, because a Turnstile token is accepted only once.
export function useHumanCheck(action) {
  const { turnstileSiteKey: siteKey = null } = useStorefront()
  const [token, setToken] = useState('')
  const [round, setRound] = useState(0)
  const reset = useCallback(() => { setToken(''); setRound((value) => value + 1) }, [])
  return {
    token: siteKey ? token : '',
    ready: !siteKey || Boolean(token),
    reset,
    widget: { key: round, siteKey, action, onToken: setToken },
  }
}
