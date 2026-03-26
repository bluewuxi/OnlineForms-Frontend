import { QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { OrgSessionProvider } from '../features/org-session/OrgSessionContext'
import { appQueryClient } from './queryClient'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={appQueryClient}>
      <OrgSessionProvider>{children}</OrgSessionProvider>
    </QueryClientProvider>
  )
}
