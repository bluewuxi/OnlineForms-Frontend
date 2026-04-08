import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OrgSessionContext, type OrgSessionContextValue } from './OrgSessionReactContext'
import { useCanWrite } from './useCanWrite'

function makeWrapper(role: string) {
  const contextValue: OrgSessionContextValue = {
    session: { userId: 'test-user', tenantId: 'tenant-1', role },
    signIn: () => undefined,
    signOut: () => undefined,
  }
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <OrgSessionContext.Provider value={contextValue}>
        {children}
      </OrgSessionContext.Provider>
    )
  }
}

describe('useCanWrite', () => {
  it('returns true for org_admin', () => {
    const { result } = renderHook(() => useCanWrite(), {
      wrapper: makeWrapper('org_admin'),
    })
    expect(result.current).toBe(true)
  })

  it('returns true for org_editor', () => {
    const { result } = renderHook(() => useCanWrite(), {
      wrapper: makeWrapper('org_editor'),
    })
    expect(result.current).toBe(true)
  })

  it('returns false for org_viewer', () => {
    const { result } = renderHook(() => useCanWrite(), {
      wrapper: makeWrapper('org_viewer'),
    })
    expect(result.current).toBe(false)
  })
})
