import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { OrgSessionHeaders } from '../../lib/api'
import {
  ORG_SESSION_STORAGE_KEY,
  clearStoredOrgSession,
  isSessionExpired,
  readStoredOrgSession,
  writeStoredOrgSession,
} from './storage'
import { OrgSessionContext, type OrgSessionContextValue } from './OrgSessionReactContext'

export function OrgSessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<OrgSessionHeaders | null>(() =>
    readStoredOrgSession(),
  )

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORG_SESSION_STORAGE_KEY) {
        setSession(readStoredOrgSession())
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (!session || typeof session.expiresAtEpochSeconds !== 'number') {
      return
    }
    const nowEpochSeconds = Math.floor(Date.now() / 1000)
    const secondsUntilExpiry = Math.max(session.expiresAtEpochSeconds - nowEpochSeconds, 0)
    const timerId = window.setTimeout(() => {
      clearStoredOrgSession()
      setSession(null)
    }, secondsUntilExpiry * 1000)
    return () => window.clearTimeout(timerId)
  }, [session])

  const value: OrgSessionContextValue = {
    session,
    signIn(nextSession) {
      if (isSessionExpired(nextSession)) {
        clearStoredOrgSession()
        setSession(null)
        return
      }
      writeStoredOrgSession(nextSession)
      setSession(nextSession)
    },
    signOut() {
      clearStoredOrgSession()
      setSession(null)
    },
  }

  return (
    <OrgSessionContext.Provider value={value}>
      {children}
    </OrgSessionContext.Provider>
  )
}
