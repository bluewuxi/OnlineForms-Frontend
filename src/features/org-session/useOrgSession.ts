import { useContext } from 'react'
import { OrgSessionContext } from './OrgSessionReactContext'

export function useOrgSession() {
  const context = useContext(OrgSessionContext)

  if (!context) {
    throw new Error('useOrgSession must be used within OrgSessionProvider.')
  }

  return context
}
