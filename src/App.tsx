import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './app/AppProviders'
import { createAppRouter } from './app/routes'

const router = createAppRouter()

function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

export default App
