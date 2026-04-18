import { useContext } from 'react'
import { TenantThemeContext } from './TenantThemeProvider'

export function useTenantTheme() {
  return useContext(TenantThemeContext)
}
