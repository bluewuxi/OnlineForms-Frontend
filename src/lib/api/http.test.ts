import { describe, expect, it } from 'vitest'
import {
  buildQueryString,
  createCorrelationId,
  createIdempotencyKey,
  joinApiUrl,
} from './http'

describe('api helpers', () => {
  it('builds a stable query string from defined values', () => {
    expect(
      buildQueryString({
        q: 'analytics',
        limit: 20,
        cursor: undefined,
      }),
    ).toBe('?limit=20&q=analytics')
  })

  it('joins API URLs without duplicate slashes', () => {
    expect(joinApiUrl('https://example.com/v1/', '/public/demo/courses')).toBe(
      'https://example.com/v1/public/demo/courses',
    )
  })

  it('creates correlation and idempotency identifiers', () => {
    expect(createCorrelationId()).toMatch(/^corr_[a-z0-9]+$/)
    expect(createIdempotencyKey()).toMatch(/^idem_[a-z0-9]+$/)
  })
})
