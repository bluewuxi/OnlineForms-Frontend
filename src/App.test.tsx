import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the frontend heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /onlineforms frontend/i }),
    ).toBeInTheDocument()
  })
})
