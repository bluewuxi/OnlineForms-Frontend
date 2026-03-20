import type { OrgSessionHeaders } from '../../lib/api'

export const ORG_SESSION_STORAGE_KEY = 'onlineforms.org-session'
const SESSION_EXPIRY_SKEW_SECONDS = 15

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
    typeof candidate.role === 'string' &&
    (candidate.accessToken === undefined || typeof candidate.accessToken === 'string') &&
    (candidate.idToken === undefined || typeof candidate.idToken === 'string') &&
    (candidate.refreshToken === undefined || typeof candidate.refreshToken === 'string') &&
    (candidate.expiresAtEpochSeconds === undefined ||
      typeof candidate.expiresAtEpochSeconds === 'number') &&
    (candidate.authProvider === undefined ||
      candidate.authProvider === 'mock' ||
      candidate.authProvider === 'cognito')
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
    const accessToken =
      typeof parsed.accessToken === 'string' && parsed.accessToken.trim().length > 0
        ? parsed.accessToken.trim()
        : undefined
    const idToken =
      typeof parsed.idToken === 'string' && parsed.idToken.trim().length > 0
        ? parsed.idToken.trim()
        : undefined
    const refreshToken =
      typeof parsed.refreshToken === 'string' && parsed.refreshToken.trim().length > 0
        ? parsed.refreshToken.trim()
        : undefined
    if (!isSessionShape(parsed)) {
      return null
    }
    const session = {
      ...parsed,
      tenantId,
      accessToken,
      idToken,
      refreshToken,
      role: normalizeRole(parsed.role),
    }
    if (
      typeof session.expiresAtEpochSeconds === 'number' &&
      session.expiresAtEpochSeconds <=
        Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SKEW_SECONDS
    ) {
      clearStoredOrgSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export function writeStoredOrgSession(session: OrgSessionHeaders) {
  const tenantId =
    typeof session.tenantId === 'string' && session.tenantId.trim().length > 0
      ? session.tenantId.trim()
      : undefined
  const accessToken =
    typeof session.accessToken === 'string' && session.accessToken.trim().length > 0
      ? session.accessToken.trim()
      : undefined
  const idToken =
    typeof session.idToken === 'string' && session.idToken.trim().length > 0
      ? session.idToken.trim()
      : undefined
  const refreshToken =
    typeof session.refreshToken === 'string' && session.refreshToken.trim().length > 0
      ? session.refreshToken.trim()
      : undefined
  window.localStorage.setItem(
    ORG_SESSION_STORAGE_KEY,
    JSON.stringify({
      ...session,
      tenantId,
      accessToken,
      idToken,
      refreshToken,
      role: normalizeRole(session.role),
    }),
  )
}

export function isSessionExpired(session: OrgSessionHeaders | null) {
  if (!session || typeof session.expiresAtEpochSeconds !== 'number') {
    return false
  }
  return (
    session.expiresAtEpochSeconds <=
    Math.floor(Date.now() / 1000) + SESSION_EXPIRY_SKEW_SECONDS
  )
}

export function clearStoredOrgSession() {
  window.localStorage.removeItem(ORG_SESSION_STORAGE_KEY)
}
