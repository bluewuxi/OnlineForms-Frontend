import { useOrgSession } from './useOrgSession'

/**
 * Returns true when the active session role allows write actions (org_admin or org_editor).
 * org_viewer sessions get false — use this to conditionally hide write affordances.
 */
export function useCanWrite(): boolean {
  const { session } = useOrgSession()
  return session?.role === 'org_admin' || session?.role === 'org_editor'
}
