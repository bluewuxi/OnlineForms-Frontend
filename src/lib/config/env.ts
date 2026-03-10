const defaultApiBaseUrl =
  'https://y36enrj145.execute-api.ap-southeast-2.amazonaws.com/v1'

export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl
}
