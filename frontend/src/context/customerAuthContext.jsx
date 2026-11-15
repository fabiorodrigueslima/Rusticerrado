 
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { customerLogin, customerLogout, customerMe, customerRegister } from '../services/lojaApi.js'
import { useStorefront } from './storefrontContext.js'

const CustomerAuthContext = createContext(null)
const guestSession = {
  user: null,
  csrfToken: '',
  loading: false,
  refresh: async () => null,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
}

export function CustomerAuthProvider({ children }) {
  const { mode, loading: storefrontLoading } = useStorefront()
  // Customer accounts only exist while the store sells online; in catalog mode the API answers 503.
  const accountsEnabled = mode === 'commerce'
  const [session, setSession] = useState({ user: null, csrfToken: '', loading: true })

  const refresh = useCallback(async (signal) => {
    try {
      const response = await customerMe(signal)
      setSession({ user: response.data.profile, csrfToken: response.data.csrfToken, loading: false })
      return response.data.profile
    } catch (error) {
      if (error.name === 'AbortError') throw error
      setSession({ user: null, csrfToken: '', loading: false })
      return null
    }
  }, [])

  useEffect(() => {
    if (!accountsEnabled) return
    const controller = new AbortController()
    // A sessão inicial é sincronizada com a API externa ao ciclo de renderização.
     
    refresh(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [accountsEnabled, refresh])

  const signIn = async (credentials) => {
    const response = await customerLogin(credentials)
    setSession({ user: response.data.user, csrfToken: response.data.csrfToken, loading: false })
    return response.data.user
  }

  const signUp = async (credentials, humanToken) => {
    const response = await customerRegister(credentials, undefined, humanToken)
    setSession({ user: response.data.user, csrfToken: response.data.csrfToken, loading: false })
    return response.data.user
  }

  const signOut = async () => {
    if (session.csrfToken) await customerLogout(session.csrfToken)
    setSession({ user: null, csrfToken: '', loading: false })
  }

  const current = accountsEnabled ? session : { user: null, csrfToken: '', loading: storefrontLoading }
  const value = { ...current, refresh, signIn, signUp, signOut }
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext)
  return context ?? guestSession
}
