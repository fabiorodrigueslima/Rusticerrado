import { useEffect, useRef, useState } from 'react'

// Cloudflare Turnstile ("you are not a robot"). Rendered only when the API reports a site key;
// without one the forms work exactly as before. Each token works once, so the parent changes
// the `key` prop after every submit to get a fresh challenge.
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise = null

function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
    script.onerror = () => { scriptPromise = null; reject(new Error('turnstile')) }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export function TurnstileWidget({ siteKey, action, onToken }) {
  const container = useRef(null)
  const callback = useRef(onToken)
  const [failed, setFailed] = useState(false)
  useEffect(() => { callback.current = onToken })
  useEffect(() => {
    if (!siteKey) return undefined
    let widgetId = null
    let cancelled = false
    loadScript().then((turnstile) => {
      if (cancelled || !container.current) return
      widgetId = turnstile.render(container.current, {
        sitekey: siteKey,
        action,
        language: 'pt-BR',
        callback: (token) => callback.current(token),
        'expired-callback': () => callback.current(''),
        'error-callback': () => callback.current(''),
      })
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => {
      cancelled = true
      if (widgetId !== null) window.turnstile?.remove(widgetId)
    }
  }, [siteKey, action])
  if (!siteKey) return null
  return <div className="turnstile-box">
    <div ref={container} />
    {failed && <p role="alert">Não foi possível carregar a verificação anti-robô. Recarregue a página.</p>}
  </div>
}
