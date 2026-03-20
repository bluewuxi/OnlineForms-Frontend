import { render, screen } from '@testing-library/react'
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
    window.localStorage.clear()
  })

  it('renders the landing page', async () => {
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { name: /onlineforms frontend/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /internal management portal/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^courses$/i })).not.toBeInTheDocument()
  })

  it('redirects org routes to login without a session', async () => {
    renderRoute('/org/submissions')

    expect(
      await screen.findByRole('heading', { name: /mvp organization login/i }),
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
    const originalFetch = global.fetch
    global.fetch = vi.fn(async () =>
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
      global.fetch = originalFetch
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
