const defaultApiBaseUrl =
  'https://form-api.kidrawer.com/v1'
const defaultTenantCodes: string[] = ['std-school']
const defaultAuthMode = 'mock'

export type FrontendAuthMode = 'mock' | 'cognito'
export type CognitoTokenUse = 'access' | 'id'
export type CognitoAuthConfig = {
  domain: string
  clientId: string
  redirectUri: string
  scopes: string[]
}

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl
}

export function getFallbackTenantCodes(): string[] {
  const raw = import.meta.env.VITE_PUBLIC_TENANT_CODES?.trim()
  if (!raw) {
    return defaultTenantCodes
  }

  const values = raw
    .split(',')
    .map((value: string) => value.trim().toLowerCase())
    .filter((value: string) => value.length > 0)

  return values.length > 0 ? values : defaultTenantCodes
}

export function getFrontendAuthMode(): FrontendAuthMode {
  const raw = import.meta.env.VITE_AUTH_MODE?.trim().toLowerCase()
  if (raw === 'cognito') {
    return 'cognito'
  }
  return defaultAuthMode
}

export function getFrontendCognitoTokenUse(): CognitoTokenUse {
  const raw = import.meta.env.VITE_COGNITO_TOKEN_USE?.trim().toLowerCase()
  if (raw === 'id') {
    return 'id'
  }
  return 'access'
}

export function getCognitoAuthConfig(): CognitoAuthConfig {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN?.trim() || ''
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID?.trim() || ''
  const redirectUri = import.meta.env.VITE_COGNITO_REDIRECT_URI?.trim() || ''
  const rawScopes = import.meta.env.VITE_COGNITO_SCOPE?.trim() || 'openid profile email'
  const scopes = rawScopes
    .split(/\s+/)
    .map((value: string) => value.trim())
    .filter((value: string) => value.length > 0)

  if (!domain || !clientId || !redirectUri) {
    throw new Error(
      'Cognito auth is enabled but missing VITE_COGNITO_DOMAIN, VITE_COGNITO_CLIENT_ID, or VITE_COGNITO_REDIRECT_URI.',
    )
  }

  return {
    domain,
    clientId,
    redirectUri,
    scopes: scopes.length > 0 ? scopes : ['openid', 'profile', 'email'],
  }
}


