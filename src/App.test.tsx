import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { appRoutes } from './app/routes'

function renderRoute(initialEntry: string) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [initialEntry],
  })

  return render(<RouterProvider router={router} />)
}

describe('App routing', () => {
  it('renders the landing page', async () => {
    renderRoute('/')

    expect(
      await screen.findByRole('heading', { name: /onlineforms frontend/i }),
    ).toBeInTheDocument()
  })

  it('renders the org submissions route', async () => {
    renderRoute('/org/submissions')

    expect(
      await screen.findByRole('heading', { name: /submission review queue/i }),
    ).toBeInTheDocument()
  })
})
