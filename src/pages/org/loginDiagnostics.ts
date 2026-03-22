export type LoginDiagnosticPhase =
  | 'callback'
  | 'contexts'
  | 'context_validation'

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
