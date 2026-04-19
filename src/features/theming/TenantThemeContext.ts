import { createContext } from 'react'
import type { TenantTheme } from '../../lib/api/types'

export type TenantThemeContextValue = {
  theme: TenantTheme | null
}

export const TenantThemeContext = createContext<TenantThemeContextValue>({ theme: null })
