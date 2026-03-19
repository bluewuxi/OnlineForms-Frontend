import { describe, expect, it } from 'vitest'
import {
  isReservedTenantCode,
  isValidTenantCode,
  normalizeTenantCode,
} from './tenantCode'

describe('tenantCode routing guards', () => {
  it('normalizes case and whitespace', () => {
    expect(normalizeTenantCode('  Std-School ')).toBe('std-school')
  })

  it('detects reserved route slugs', () => {
    expect(isReservedTenantCode('org')).toBe(true)
    expect(isReservedTenantCode('ORG')).toBe(true)
    expect(isReservedTenantCode('std-school')).toBe(false)
  })

  it('validates tenant codes and blocks reserved values', () => {
    expect(isValidTenantCode('std-school')).toBe(true)
    expect(isValidTenantCode('org')).toBe(false)
    expect(isValidTenantCode('bad code')).toBe(false)
  })
})
