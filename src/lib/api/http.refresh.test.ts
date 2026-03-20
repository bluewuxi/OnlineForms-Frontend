import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './http'
import { registerSessionLifecycleHandlers } from './sessionLifecycle'

const refreshCognitoSessionMock = vi.fn()

vi.mock('../../features/org-session/cognito', () => ({
  refreshCognitoSession: (...args: unknown[]) =>
    refreshCognitoSessionMock(...args),
}))

describe('apiRequest refresh flow', () => {
  beforeEach(() => {
    refreshCognitoSessionMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('refreshes and retries once after 401 for cognito sessions', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Expired.' } }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )

    refreshCognitoSessionMock.mockResolvedValue({
      userId: 'usr_1',
      role: 'org_admin',
      tenantId: 'ten_1',
      accessToken: 'new-access-token',
      refreshToken: 'refresh-token',
      authProvider: 'cognito',
      expiresAtEpochSeconds: Math.floor(Date.now() / 1000) + 3600,
    })

    await apiRequest<{ data: { ok: boolean } }>({
      path: '/org/me',
      session: {
        userId: 'usr_1',
        role: 'org_admin',
        tenantId: 'ten_1',
        accessToken: 'old-access-token',
        refreshToken: 'refresh-token',
        authProvider: 'cognito',
      },
    })

    expect(refreshCognitoSessionMock).toHaveBeenCalledTimes(1)
    const secondRequestHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers
    expect(secondRequestHeaders.get('Authorization')).toBe(
      'Bearer new-access-token',
    )
  })

  it('invalidates session when refresh fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Expired.' } }),
        { status: 401, headers: { 'content-type': 'application/json' } },
      ),
    )
    refreshCognitoSessionMock.mockRejectedValue(new Error('refresh failed'))
    const onSessionInvalidated = vi.fn()
    const unregister = registerSessionLifecycleHandlers({
      onSessionInvalidated,
    })

    await expect(
      apiRequest<{ data: { ok: boolean } }>({
        path: '/org/me',
        session: {
          userId: 'usr_1',
          role: 'org_admin',
          accessToken: 'old-access-token',
          refreshToken: 'refresh-token',
          authProvider: 'cognito',
        },
      }),
    ).rejects.toHaveProperty('status', 401)
    expect(onSessionInvalidated).toHaveBeenCalledTimes(1)

    unregister()
  })
})
