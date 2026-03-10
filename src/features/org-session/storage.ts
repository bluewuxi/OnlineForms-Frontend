import type { OrgSessionHeaders } from '../../lib/api'

export const ORG_SESSION_STORAGE_KEY = 'onlineforms.org-session'

function isSessionShape(value: unknown): value is OrgSessionHeaders {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.userId === 'string' &&
    typeof candidate.tenantId === 'string' &&
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
    return isSessionShape(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeStoredOrgSession(session: OrgSessionHeaders) {
  window.localStorage.setItem(ORG_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredOrgSession() {
  window.localStorage.removeItem(ORG_SESSION_STORAGE_KEY)
}
