import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
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
        role: 'org-admin',
      }),
    )

    renderRoute('/org/submissions')

    expect(
      await screen.findByRole('heading', { name: /submission review queue/i }),
    ).toBeInTheDocument()
  })
})
