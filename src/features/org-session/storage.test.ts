import { describe, expect, it, vi } from 'vitest'
import {
  ORG_SESSION_STORAGE_KEY,
  clearStoredOrgSession,
  isSessionExpired,
  readStoredOrgSession,
  writeStoredOrgSession,
} from './storage'

describe('org session storage', () => {
  it('persists and restores token-backed sessions', () => {
    clearStoredOrgSession()
    writeStoredOrgSession({
      userId: 'usr_1',
      tenantId: 'ten_1',
      role: 'org-admin',
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      expiresAtEpochSeconds: Math.floor(Date.now() / 1000) + 3600,
      authProvider: 'cognito',
    })

    const session = readStoredOrgSession()
    expect(session).toMatchObject({
      userId: 'usr_1',
      tenantId: 'ten_1',
      role: 'org_admin',
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      authProvider: 'cognito',
    })
  })

  it('drops expired sessions from localStorage at read time', () => {
    clearStoredOrgSession()
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'usr_1',
        role: 'org_admin',
        expiresAtEpochSeconds: 10,
      }),
    )
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(30_000)
    try {
      expect(readStoredOrgSession()).toBeNull()
      expect(window.localStorage.getItem(ORG_SESSION_STORAGE_KEY)).toBeNull()
    } finally {
      nowSpy.mockRestore()
    }
  })

  it('detects expiring sessions for provider guard logic', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(100_000)
    try {
      expect(
        isSessionExpired({
          userId: 'usr_1',
          role: 'org_admin',
          expiresAtEpochSeconds: 110,
        }),
      ).toBeTruthy()
      expect(
        isSessionExpired({
          userId: 'usr_1',
          role: 'org_admin',
          expiresAtEpochSeconds: 500,
        }),
      ).toBeFalsy()
    } finally {
      nowSpy.mockRestore()
    }
  })
})
