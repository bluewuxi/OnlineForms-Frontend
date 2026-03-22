import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { AppProviders } from './app/AppProviders'
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
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders the landing page', async () => {
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { name: /onlineforms frontend/i }),
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
      await screen.findByRole('heading', { name: /tenant course management/i }),
    ).toBeInTheDocument()
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
      await screen.findByRole('heading', { name: /find your next course/i }),
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
            description: 'Tenant profile',
            homePageContent: 'Welcome to Standard School.',
            isActive: true,
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
})
