const defaultApiBaseUrl =
  'https://form-api.kidrawer.com/v1'

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl
}


