const tenantCodePattern = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

export const reservedTenantCodes = new Set([
  'admin',
  'api',
  'courses',
  'health',
  'internal',
  'org',
  'public',
  't',
  'v1',
])

export function normalizeTenantCode(value: string) {
  return value.trim().toLowerCase()
}

export function isReservedTenantCode(value: string) {
  return reservedTenantCodes.has(normalizeTenantCode(value))
}

export function isValidTenantCode(value: string) {
  const code = normalizeTenantCode(value)
  return tenantCodePattern.test(code) && !isReservedTenantCode(code)
}
