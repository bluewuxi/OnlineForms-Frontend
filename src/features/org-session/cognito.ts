import type { OrgSessionHeaders } from '../../lib/api'
import {
  getCognitoAuthConfig,
  getFrontendAuthMode,
} from '../../lib/config/env'

const COGNITO_LOGIN_STORAGE_KEY = 'onlineforms.cognito.login'

type StoredCognitoLoginState = {
  state: string
  codeVerifier: string
  requestedReturnTo?: string
}

type TokenResponse = {
  access_token: string
  id_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
}

function toBase64Url(buffer: Uint8Array) {
  let binary = ''
  for (let index = 0; index < buffer.byteLength; index += 1) {
    binary += String.fromCharCode(buffer[index])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function createRandomToken(size = 32) {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

async function createCodeChallenge(codeVerifier: string) {
  const encoded = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', encoded)
  return toBase64Url(new Uint8Array(digest))
}

function readStoredLoginState() {
  if (typeof window === 'undefined') {
    return null
  }
  const raw = window.sessionStorage.getItem(COGNITO_LOGIN_STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as StoredCognitoLoginState
    if (
      !parsed ||
      typeof parsed.state !== 'string' ||
      typeof parsed.codeVerifier !== 'string'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function clearStoredLoginState() {
  if (typeof window === 'undefined') {
    return
  }
  window.sessionStorage.removeItem(COGNITO_LOGIN_STORAGE_KEY)
}

function parseJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length < 2) {
    throw new Error('Malformed JWT token.')
  }
  const payload = parts[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')
  return JSON.parse(atob(padded)) as Record<string, unknown>
}

function pickString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined
}

function roleFromClaims(claims: Record<string, unknown>) {
  const direct = pickString(claims['custom:platformRole'])
    || pickString(claims['custom:role'])
    || pickString(claims.role)
  if (direct) {
    return direct
  }
  const groups = claims['cognito:groups']
  if (Array.isArray(groups) && typeof groups[0] === 'string') {
    return groups[0]
  }
  return undefined
}

function pickRole(...claimSets: Array<Record<string, unknown> | undefined>) {
  for (const claims of claimSets) {
    if (!claims) continue
    const role = roleFromClaims(claims)
    if (role) {
      return role
    }
  }
  throw new Error('Authenticated token does not contain a supported role claim.')
}

export function isCognitoAuthEnabled() {
  return getFrontendAuthMode() === 'cognito'
}

export async function startCognitoLogin(requestedReturnTo?: string) {
  if (!isCognitoAuthEnabled()) {
    throw new Error('Cognito login flow is disabled.')
  }
  const config = getCognitoAuthConfig()
  const state = createRandomToken()
  const codeVerifier = createRandomToken(64)
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const authorizeUrl = new URL('/oauth2/authorize', config.domain)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', config.clientId)
  authorizeUrl.searchParams.set('redirect_uri', config.redirectUri)
  authorizeUrl.searchParams.set('scope', config.scopes.join(' '))
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)

  window.sessionStorage.setItem(
    COGNITO_LOGIN_STORAGE_KEY,
    JSON.stringify({
      state,
      codeVerifier,
      requestedReturnTo,
    } satisfies StoredCognitoLoginState),
  )

  window.location.assign(authorizeUrl.toString())
}

export async function completeCognitoLoginFromUrl(search: string) {
  if (!isCognitoAuthEnabled()) {
    return null
  }
  const params = new URLSearchParams(search)
  const code = params.get('code')
  const state = params.get('state')
  if (!code || !state) {
    return null
  }
  const stored = readStoredLoginState()
  if (!stored) {
    throw new Error('Missing login state for Cognito callback.')
  }
  if (stored.state !== state) {
    throw new Error('Cognito callback state mismatch.')
  }

  const config = getCognitoAuthConfig()
  const tokenUrl = new URL('/oauth2/token', config.domain)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code,
    redirect_uri: config.redirectUri,
    code_verifier: stored.codeVerifier,
  })
  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  if (!response.ok) {
    clearStoredLoginState()
    throw new Error('Failed to exchange authorization code with Cognito.')
  }
  const tokens = (await response.json()) as TokenResponse
  if (!tokens.access_token) {
    clearStoredLoginState()
    throw new Error('Cognito token response is missing access_token.')
  }

  const accessClaims = parseJwtPayload(tokens.access_token)
  const idClaims = tokens.id_token ? parseJwtPayload(tokens.id_token) : undefined
  const session: OrgSessionHeaders = {
    userId: pickString(idClaims?.sub) || pickString(accessClaims.sub) || '',
    username:
      pickString(idClaims?.['cognito:username']) ||
      pickString(accessClaims.username) ||
      pickString(idClaims?.email) ||
      pickString(accessClaims.email),
    preferredName:
      pickString(idClaims?.preferred_username) ||
      pickString(idClaims?.name) ||
      pickString(accessClaims.preferred_username) ||
      pickString(accessClaims.name),
    role: pickRole(idClaims, accessClaims),
    tenantId:
      pickString(idClaims?.['custom:tenantId']) ||
      pickString(idClaims?.tenantId) ||
      pickString(accessClaims['custom:tenantId']) ||
      pickString(accessClaims.tenantId),
    accessToken: tokens.access_token,
    idToken: tokens.id_token,
    refreshToken: tokens.refresh_token,
    expiresAtEpochSeconds:
      typeof tokens.expires_in === 'number'
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : undefined,
    authProvider: 'cognito',
  }

  clearStoredLoginState()
  return {
    session,
    requestedReturnTo: stored.requestedReturnTo,
  }
}

export async function refreshCognitoSession(currentSession: OrgSessionHeaders) {
  if (!currentSession.refreshToken) {
    throw new Error('Cannot refresh session without a refresh token.')
  }
  const config = getCognitoAuthConfig()
  const tokenUrl = new URL('/oauth2/token', config.domain)
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    refresh_token: currentSession.refreshToken,
  })
  const response = await fetch(tokenUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  if (!response.ok) {
    throw new Error('Failed to refresh Cognito tokens.')
  }
  const tokens = (await response.json()) as TokenResponse
  if (!tokens.access_token) {
    throw new Error('Cognito refresh response missing access_token.')
  }
  const accessClaims = parseJwtPayload(tokens.access_token)
  const idClaims = tokens.id_token ? parseJwtPayload(tokens.id_token) : undefined
  return {
    ...currentSession,
    userId: pickString(idClaims?.sub) || pickString(accessClaims.sub) || currentSession.userId,
    username:
      pickString(idClaims?.['cognito:username']) ||
      pickString(accessClaims.username) ||
      pickString(idClaims?.email) ||
      pickString(accessClaims.email) ||
      currentSession.username,
    preferredName:
      pickString(idClaims?.preferred_username) ||
      pickString(idClaims?.name) ||
      pickString(accessClaims.preferred_username) ||
      pickString(accessClaims.name) ||
      currentSession.preferredName,
    role: pickRole(idClaims, accessClaims),
    tenantId:
      pickString(idClaims?.['custom:tenantId']) ||
      pickString(idClaims?.tenantId) ||
      pickString(accessClaims['custom:tenantId']) ||
      pickString(accessClaims.tenantId) ||
      currentSession.tenantId,
    accessToken: tokens.access_token,
    idToken: tokens.id_token || currentSession.idToken,
    refreshToken: tokens.refresh_token || currentSession.refreshToken,
    expiresAtEpochSeconds:
      typeof tokens.expires_in === 'number'
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : currentSession.expiresAtEpochSeconds,
    authProvider: 'cognito' as const,
  }
}
