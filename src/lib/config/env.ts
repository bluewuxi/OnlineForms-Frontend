const defaultApiBaseUrl =
  'https://form-api.kidrawer.com/v1'
const defaultTenantCodes = ['std-school']

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl
}

export function getFallbackTenantCodes() {
  const raw = import.meta.env.VITE_PUBLIC_TENANT_CODES?.trim()
  if (!raw) {
    return defaultTenantCodes
  }

  const values = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0)

  return values.length > 0 ? values : defaultTenantCodes
}


