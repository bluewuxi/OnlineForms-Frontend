import { describe, expect, it } from 'vitest'
import {
  getInternalAccessDiagnosticMessage,
  toLoginDiagnosticMessage,
} from './loginDiagnostics'

describe('login diagnostics mapping', () => {
  it('maps callback state mismatch to a clear message', () => {
    expect(
      toLoginDiagnosticMessage('callback', 'Cognito callback state mismatch.'),
    ).toMatch(/state mismatch/i)
  })

  it('maps contexts unauthorized failures to membership guidance', () => {
    expect(
      toLoginDiagnosticMessage('contexts', '403 FORBIDDEN'),
    ).toMatch(/tenant contexts/i)
  })

  it('maps context role validation failures to readable copy', () => {
    expect(
      toLoginDiagnosticMessage(
        'context_validation',
        'Selected role is not allowed for selected tenant.',
      ),
    ).toMatch(/not allowed/i)
  })

  it('shows missing internal capability guidance with token role', () => {
    expect(
      getInternalAccessDiagnosticMessage({
        canOpenInternalManagement: false,
        hasActiveContexts: true,
        tokenRole: 'org_admin',
      }),
    ).toMatch(/internal_admin/)
  })

  it('shows no-membership guidance when internal access is available', () => {
    expect(
      getInternalAccessDiagnosticMessage({
        canOpenInternalManagement: true,
        hasActiveContexts: false,
        tokenRole: 'internal_admin',
      }),
    ).toMatch(/no active tenant memberships/i)
  })
})
