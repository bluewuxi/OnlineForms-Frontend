const defaultApiBaseUrl =
  'https://5n7ng70uw5.execute-api.ap-southeast-2.amazonaws.com/v1'

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl
}

