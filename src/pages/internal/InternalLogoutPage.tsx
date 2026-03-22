import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrgSession } from '../../features/org-session/useOrgSession'

export function InternalLogoutPage() {
  const navigate = useNavigate()
  const { signOut } = useOrgSession()

  useEffect(() => {
    navigate('/', { replace: true })
    signOut()
  }, [navigate, signOut])

  return null
}
