import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AppProviders } from './app/AppProviders'
import { appQueryClient } from './app/queryClient'
import { appRoutes } from './app/routes'
import { ORG_SESSION_STORAGE_KEY } from './features/org-session/storage'

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  })

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )
}

describe('App routing', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AUTH_MODE', 'mock')
    window.localStorage.clear()
    appQueryClient.clear()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders the landing page', async () => {
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { name: /choose a training provider/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /^management$/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^courses$/i })).not.toBeInTheDocument()
  })

  it('redirects org routes to login without a session', async () => {
    renderRoute('/org/submissions')

    expect(
      await screen.findByRole('heading', { name: /management login/i }),
    ).toBeInTheDocument()
  })

  it('routes management entry to login in mock mode', async () => {
    renderRoute('/management')

    expect(
      await screen.findByRole('heading', { name: /management login/i }),
    ).toBeInTheDocument()
  })

  it('renders protected org routes when a session exists', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
      }),
    )

    renderRoute('/org/submissions')

    expect(
      await screen.findByRole('heading', { name: /submission review queue/i }),
    ).toBeInTheDocument()
  })

  it('redirects to login for unusable cognito session state', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
        authProvider: 'cognito',
      }),
    )

    renderRoute('/org/submissions')

    expect(
      await screen.findByRole('heading', { name: /management login/i }),
    ).toBeInTheDocument()
  })

  it('shows management login labels and allows internal_admin without tenant', async () => {
    renderRoute('/org/login')

    expect(await screen.findByText(/username/i)).toBeInTheDocument()
    expect(screen.getByText(/^tenant$/i)).toBeInTheDocument()
    expect(screen.getByText(/^role$/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^courses$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^submissions$/i })).not.toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/username/i), 'internal-user')
    const tenantSelect = screen.getByLabelText(/^tenant$/i) as HTMLSelectElement
    if (tenantSelect.options.length > 1) {
      await user.selectOptions(tenantSelect, tenantSelect.options[1].value)
      expect(tenantSelect).not.toHaveValue('')
    }
    await user.selectOptions(screen.getByLabelText(/^role$/i), 'internal_admin')
    expect(screen.getByLabelText(/^tenant$/i)).toHaveValue('')
    await user.click(screen.getByRole('button', { name: /continue to management/i }))

    expect(
      await screen.findByRole('heading', { name: /tenant management/i }),
    ).toBeInTheDocument()
  })

  it('enforces role-safe returnTo for internal login', async () => {
    renderRoute('/org/login?returnTo=%2Forg%2Fsubmissions')

    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/username/i), 'internal-user')
    await user.selectOptions(screen.getByLabelText(/^role$/i), 'internal_admin')
    await user.click(screen.getByRole('button', { name: /continue to management/i }))

    expect(
      await screen.findByRole('heading', { name: /tenant management/i }),
    ).toBeInTheDocument()
  })

  it('renders the org courses route when a session exists', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
      }),
    )

    renderRoute('/org/courses')

    expect(
      await screen.findByRole('heading', { name: /courses are the center of tenant operations/i }),
    ).toBeInTheDocument()
  })

  it('renders the org settings route when a session exists', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
      }),
    )

    renderRoute('/org/settings')

    expect(
      await screen.findByRole('heading', { name: /tenant settings and operational references/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^settings$/i })).toHaveClass(
      'site-header__link--active',
    )
  })

  it('renders org branding with editable tenant description', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
      }),
    )

    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/org/branding')) {
        return new Response(
          JSON.stringify({
            data: {
              tenantId: 'tenant-123',
              displayName: 'Standard School',
              description: '<p>Current tenant description</p>',
              logoAssetId: 'ast_logo_1',
              logoUrl: 'https://assets.example.com/ast_logo_1.svg',
              updatedAt: '2026-04-02T00:00:00Z',
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    try {
      renderRoute('/org/branding')

      expect(
        await screen.findByRole('heading', { name: /branding and public identity/i }),
      ).toBeInTheDocument()
      expect(
        await screen.findByRole('img', { name: /standard school current logo/i }),
      ).toHaveAttribute('src', 'https://assets.example.com/ast_logo_1.svg')
      expect(
        await screen.findByRole('textbox', { name: /tenant description/i }),
      ).toHaveValue('<p>Current tenant description</p>')
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('renders the form designer route when a session exists', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
      }),
    )

    renderRoute('/org/courses/crs_demo_001/form')

    expect(
      await screen.findByRole('heading', { name: /course form template/i }),
    ).toBeInTheDocument()
  })

  it('redirects legacy /t tenant route to tenant-first route', async () => {
    renderRoute('/t/acme-training/courses')

    expect(
      await screen.findByRole('heading', { name: /published courses ready for enrolment/i }),
    ).toBeInTheDocument()
  })

  it('treats reserved tenant slugs as non-tenant routes', async () => {
    renderRoute('/api/courses')

    expect(
      await screen.findByRole('heading', { name: /we could not find that page/i }),
    ).toBeInTheDocument()
  })

  it('renders tenant home route', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            tenantCode: 'std-school',
            displayName: 'Standard School',
            description: '<p>Tenant <strong>profile</strong> with <a href="/std-school/courses">course links</a>.</p>',
            homePageContent: 'Welcome to Standard School.',
            isActive: true,
            branding: {
              logoUrl: 'https://assets.example.com/std-school-logo.svg',
            },
            links: {
              publishedCourses: '/v1/public/std-school/courses',
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ) as typeof fetch

    try {
      renderRoute('/std-school')
      expect(
        await screen.findByRole('heading', { name: /standard school/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /standard school logo/i })).toHaveAttribute(
        'src',
        'https://assets.example.com/std-school-logo.svg',
      )
      expect(screen.getByRole('link', { name: /course links/i })).toHaveAttribute(
        'href',
        '/std-school/courses',
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('renders course detail rich text safely', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/public/std-school/courses/crs_demo_001')) {
        return new Response(
          JSON.stringify({
            data: {
              id: 'crs_demo_001',
              title: 'Intro to AI',
              shortDescription: 'Short summary',
              fullDescription: '<p>Learn <strong>core concepts</strong> and review the <a href=\"/std-school/courses\">course list</a>.</p>',
              deliveryMode: 'online',
              startDate: '2026-04-01',
              endDate: '2026-04-30',
              locationText: null,
              capacity: 20,
              enrollmentOpenAt: '2026-03-01T00:00:00Z',
              enrollmentCloseAt: '2026-03-31T00:00:00Z',
              enrollmentOpenNow: true,
              enrollmentStatus: 'open',
              formAvailable: false,
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    try {
      renderRoute('/std-school/courses/crs_demo_001')
      expect(
        await screen.findByRole('heading', { name: /what this course covers/i }),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /course list/i })).toHaveAttribute(
        'href',
        '/std-school/courses',
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('renders internal tenant management route when a session exists', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'internal_admin',
      }),
    )

    renderRoute('/internal/tenants')

    expect(
      await screen.findByRole('heading', { name: /tenant management/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute(
      'href',
      '/internal',
    )
    expect(screen.getByRole('link', { name: /^tenants$/i })).toHaveClass(
      'site-header__link--active',
    )
    expect(screen.getByRole('link', { name: /^users$/i })).toHaveAttribute(
      'href',
      '/internal/users',
    )
    expect(screen.queryByRole('link', { name: /^logout$/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /demo-user/i })).toBeInTheDocument()
    expect(screen.getByText(/internal_admin/i)).toBeInTheDocument()

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /demo-user/i }))
    expect(screen.getByRole('menuitem', { name: /logout/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /logout/i })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /demo-user/i })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: /demo-user/i }))
    await user.click(screen.getByRole('menuitem', { name: /logout/i }))
    expect(
      await screen.findByRole('heading', { name: /choose a training provider/i }),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem(ORG_SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByRole('link', { name: /^home$/i })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.queryByRole('link', { name: /^courses$/i })).not.toBeInTheDocument()
  })

  it('blocks internal tenant route for non-internal roles', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: 'tenant-123',
        role: 'org_admin',
      }),
    )

    renderRoute('/internal/tenants')

    expect(
      await screen.findByRole('heading', {
        name: /you are not authorised to view this page/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders internal users route when a session exists', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: '__internal__',
        role: 'internal_admin',
      }),
    )

    renderRoute('/internal/users')

    expect(
      await screen.findByRole('heading', { name: /internal users/i }),
    ).toBeInTheDocument()
  })

  it('renders internal home route with quick links', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: '__internal__',
        role: 'internal_admin',
      }),
    )

    renderRoute('/internal')

    expect(
      await screen.findByRole('heading', { name: /internal management/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /open tenants/i })).toHaveAttribute(
      'href',
      '/internal/tenants',
    )
    expect(screen.getByRole('link', { name: /open users/i })).toHaveAttribute(
      'href',
      '/internal/users',
    )
  })

  it('logs out from internal route and redirects to home', async () => {
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        tenantId: '__internal__',
        role: 'internal_admin',
      }),
    )

    renderRoute('/internal/logout')

    expect(
      await screen.findByRole('heading', { name: /choose a training provider/i }),
    ).toBeInTheDocument()
    expect(window.localStorage.getItem(ORG_SESSION_STORAGE_KEY)).toBeNull()
  })

  it('shows account-switch controls in cognito post-auth context', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'cognito')
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        role: 'org_admin',
        authProvider: 'cognito',
        accessToken: 'claims-access-token',
        refreshToken: 'claims-refresh-token',
      }),
    )
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/public/tenants')) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (url.includes('/public/auth-options')) {
        return new Response(
          JSON.stringify({
            data: {
              roles: [
                { role: 'org_admin', label: 'Org Admin', requiresTenant: true },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/org/session-contexts')) {
        return new Response(
          JSON.stringify({
            data: {
              userId: 'demo-user',
              tokenRole: 'org_admin',
              canAccessInternalPortal: false,
              contexts: [
                {
                  tenantId: 'tenant-123',
                  status: 'active',
                  roles: ['org_admin'],
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    try {
      renderRoute('/org/login')
      expect(
        await screen.findByRole('button', { name: /use different account/i }),
      ).toBeInTheDocument()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('does not route post-login context selection back to /org/login', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'cognito')
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        role: 'org_admin',
        authProvider: 'cognito',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    )

    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/public/tenants')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                tenantId: 'tenant-123',
                tenantCode: 'std-school',
                displayName: 'Standard School',
                isActive: true,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/public/auth-options')) {
        return new Response(
          JSON.stringify({
            data: {
              roles: [
                { role: 'org_admin', label: 'Org Admin', requiresTenant: true },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/org/session-contexts')) {
        return new Response(
          JSON.stringify({
            data: {
              userId: 'demo-user',
              tokenRole: 'org_admin',
              canAccessInternalPortal: false,
              contexts: [
                {
                  tenantId: 'tenant-123',
                  status: 'active',
                  roles: ['org_admin'],
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/org/session-context')) {
        return new Response(
          JSON.stringify({
            data: {
              userId: 'demo-user',
              tenantId: 'tenant-123',
              role: 'org_admin',
              shell: {
                portal: 'org',
                tenantScoped: true,
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof fetch

    try {
      const user = userEvent.setup()
      renderRoute('/org/login?returnTo=%2Forg%2Flogin')

      await waitFor(() => {
        const tenantSelect = screen.getByLabelText(/^tenant$/i) as HTMLSelectElement
        expect(tenantSelect.options.length).toBeGreaterThan(1)
      })
      await user.selectOptions(screen.getByLabelText(/^tenant$/i), 'tenant-123')
      await user.selectOptions(screen.getByLabelText(/^role$/i), 'org_admin')
      await user.click(screen.getByRole('button', { name: /continue to management/i }))

      expect(
        await screen.findByRole('heading', { name: /courses are the center of tenant operations/i }),
      ).toBeInTheDocument()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('opens internal management without tenantId when internal portal access is available from claims', async () => {
    vi.stubEnv('VITE_AUTH_MODE', 'cognito')
    window.localStorage.setItem(
      ORG_SESSION_STORAGE_KEY,
      JSON.stringify({
        userId: 'demo-user',
        role: 'org_admin',
        authProvider: 'cognito',
        accessToken: 'claims-access-token',
        refreshToken: 'claims-refresh-token',
      }),
    )

    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/public/tenants')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                tenantId: 'tenant-123',
                tenantCode: 'std-school',
                displayName: 'Standard School',
                isActive: true,
              },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/public/auth-options')) {
        return new Response(
          JSON.stringify({
            data: {
              roles: [
                { role: 'org_admin', label: 'Org Admin', requiresTenant: true },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/org/session-contexts')) {
        return new Response(
          JSON.stringify({
            data: {
              userId: 'demo-user',
              tokenRole: 'org_admin',
              canAccessInternalPortal: true,
              contexts: [
                {
                  tenantId: 'tenant-123',
                  status: 'active',
                  roles: ['org_admin'],
                },
              ],
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      if (url.includes('/org/session-context')) {
        expect(init?.body).toBe(JSON.stringify({ role: 'internal_admin', tenantId: null }))
        return new Response(
          JSON.stringify({
            data: {
              userId: 'demo-user',
              tenantId: null,
              role: 'internal_admin',
              shell: {
                portal: 'internal',
                tenantScoped: false,
              },
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchSpy as typeof fetch

    try {
      const user = userEvent.setup()
      renderRoute('/org/login')

      await user.click(await screen.findByRole('button', { name: /internal management/i }))

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.stringContaining('/org/session-context'),
          expect.objectContaining({
            body: JSON.stringify({ role: 'internal_admin', tenantId: null }),
          }),
        )
      })
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
