import type { OrgSessionHeaders } from '../../lib/api'

export const ORG_SESSION_STORAGE_KEY = 'onlineforms.org-session'

function normalizeRole(role: string) {
  return role.trim().toLowerCase().replace(/-/g, '_')
}

function isSessionShape(value: unknown): value is OrgSessionHeaders {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.userId === 'string' &&
    (candidate.tenantId === undefined || typeof candidate.tenantId === 'string') &&
    typeof candidate.role === 'string'
  )
}

export function readStoredOrgSession() {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(ORG_SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)
    const tenantId =
      typeof parsed.tenantId === 'string' && parsed.tenantId.trim().length > 0
        ? parsed.tenantId.trim()
        : undefined
    return isSessionShape(parsed)
      ? {
          ...parsed,
          tenantId,
          role: normalizeRole(parsed.role),
        }
      : null
  } catch {
    return null
  }
}

export function writeStoredOrgSession(session: OrgSessionHeaders) {
  const tenantId =
    typeof session.tenantId === 'string' && session.tenantId.trim().length > 0
      ? session.tenantId.trim()
      : undefined
  window.localStorage.setItem(
    ORG_SESSION_STORAGE_KEY,
    JSON.stringify({
      ...session,
      tenantId,
      role: normalizeRole(session.role),
    }),
  )
}

export function clearStoredOrgSession() {
  window.localStorage.removeItem(ORG_SESSION_STORAGE_KEY)
}
