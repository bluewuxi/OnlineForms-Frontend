import { getApiBaseUrl } from '../config/env'
import type {
  ApiErrorEnvelope,
  ApiRequestOptions,
  ApiResult,
  OrgSessionHeaders,
  QueryValue,
} from './types'

export class ApiClientError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: unknown
  readonly requestId?: string
  readonly correlationId?: string

  constructor(status: number, payload: ApiErrorEnvelope, fallbackMessage: string) {
    super(payload.error.message || fallbackMessage)
    this.name = 'ApiClientError'
    this.status = status
    this.code = payload.error.code
    this.details = payload.error.details
    this.requestId = payload.requestId
    this.correlationId = payload.correlationId
  }
}

function hasCryptoRandomUuid() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
}

export function createCorrelationId() {
  const value = hasCryptoRandomUuid()
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).slice(2)

  return `corr_${value}`
}

export function createIdempotencyKey() {
  const value = hasCryptoRandomUuid()
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).slice(2)

  return `idem_${value}`
}

export function buildQueryString(params?: Record<string, QueryValue>) {
  if (!params) {
    return ''
  }

  const searchParams = new URLSearchParams()

  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => searchParams.append(key, String(entry)))
        return
      }

      searchParams.set(key, String(value))
    })

  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export function joinApiUrl(baseUrl: string, path: string) {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.replace(/^\/+/, '')
  return `${normalizedBase}/${normalizedPath}`
}

function createHeaders(
  session: OrgSessionHeaders | undefined,
  correlationId: string,
  extraHeaders?: HeadersInit,
) {
  const hasBearerToken =
    typeof session?.accessToken === 'string' && session.accessToken.trim().length > 0
  return new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-correlation-id': correlationId,
    ...extraHeaders,
    ...(session
      ? hasBearerToken
        ? {
            Authorization: `Bearer ${session.accessToken}`,
            ...(session.tenantId ? { 'x-tenant-id': session.tenantId } : {}),
          }
        : {
            'x-user-id': session.userId,
            'x-role': session.role,
            ...(session.tenantId ? { 'x-tenant-id': session.tenantId } : {}),
          }
      : {}),
  })
}

export async function apiRequest<TResponse>({
  path,
  method = 'GET',
  session,
  query,
  body,
  correlationId = createCorrelationId(),
  headers,
}: ApiRequestOptions): Promise<ApiResult<TResponse>> {
  const url = joinApiUrl(getApiBaseUrl(), `${path}${buildQueryString(query)}`)
  const requestHeaders = createHeaders(session, correlationId, headers)

  if (body === undefined) {
    requestHeaders.delete('Content-Type')
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({
      error: {
        code: 'unknown_error',
        message: 'Request failed.',
      },
    }))) as ApiErrorEnvelope

    throw new ApiClientError(
      response.status,
      payload,
      `Request to ${path} failed with status ${response.status}.`,
    )
  }

  if (response.status === 204) {
    return {
      data: undefined as TResponse,
      requestId: response.headers.get('x-request-id') ?? undefined,
      correlationId,
    }
  }

  const data = (await response.json()) as TResponse

  return {
    data,
    requestId: response.headers.get('x-request-id') ?? undefined,
    correlationId,
  }
}
