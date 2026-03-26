import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { OrgSessionProvider } from '../features/org-session/OrgSessionContext'

export const appQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={appQueryClient}>
      <OrgSessionProvider>{children}</OrgSessionProvider>
    </QueryClientProvider>
  )
}
