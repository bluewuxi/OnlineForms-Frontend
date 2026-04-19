import { useContext } from 'react'
import { TenantThemeContext } from './TenantThemeContext'

export function useTenantTheme() {
  return useContext(TenantThemeContext)
}
