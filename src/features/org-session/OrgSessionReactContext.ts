import { createContext } from 'react'
import type { OrgSessionHeaders } from '../../lib/api'

export type OrgSessionContextValue = {
  session: OrgSessionHeaders | null
  signIn: (nextSession: OrgSessionHeaders) => void
  signOut: () => void
}

export const OrgSessionContext = createContext<OrgSessionContextValue | null>(
  null,
)
