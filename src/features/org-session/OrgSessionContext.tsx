import {
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import type { OrgSessionHeaders } from '../../lib/api'
import {
  ORG_SESSION_STORAGE_KEY,
  clearStoredOrgSession,
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

  const value: OrgSessionContextValue = {
    session,
    signIn(nextSession) {
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
