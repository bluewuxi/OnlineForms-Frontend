export type LoginDiagnosticPhase =
  | 'callback'
  | 'contexts'
  | 'context_validation'

export type InternalAccessDiagnosticInput = {
  tokenRole: string
  canOpenInternalManagement: boolean
  hasActiveContexts: boolean
}

export function toLoginDiagnosticMessage(
  phase: LoginDiagnosticPhase,
  rawMessage: string | null | undefined,
): string {
  const normalized = (rawMessage || '').toLowerCase()

  if (phase === 'callback') {
    if (normalized.includes('state mismatch')) {
      return 'Login verification failed (state mismatch). Start sign-in again.'
    }
    if (normalized.includes('missing login state')) {
      return 'Login session expired before callback. Start sign-in again.'
    }
    if (normalized.includes('exchange authorization code')) {
      return 'Cognito token exchange failed. Confirm Hosted UI app client settings.'
    }
    return rawMessage || 'Failed to complete Cognito login. Please try again.'
  }

  if (phase === 'contexts') {
    if (normalized.includes('unauthorized') || normalized.includes('forbidden')) {
      return 'Unable to load tenant contexts for this account. Confirm token and memberships.'
    }
    return rawMessage || 'Failed to load tenant contexts. Retry in a moment.'
  }

  if (normalized.includes('selected role is not allowed')) {
    return 'Selected role is not allowed for the selected tenant.'
  }
  if (normalized.includes('active membership')) {
    return 'No active membership for selected tenant.'
  }
  return rawMessage || 'Failed to validate selected tenant and role.'
}

export function getInternalAccessDiagnosticMessage(
  input: InternalAccessDiagnosticInput,
): string {
  if (input.canOpenInternalManagement) {
    if (!input.hasActiveContexts) {
      return 'No active tenant memberships found. You can still use Internal Management if needed.'
    }
    return 'Internal Management is available from this session.'
  }
  const roleLabel = input.tokenRole || 'unknown'
  return `Internal Management is unavailable for this account. Required claim/group: internal_admin (current token role: ${roleLabel}).`
}
