import { useEffect, useId, type PropsWithChildren } from 'react'
import type { TenantTheme } from '../../lib/api/types'
import { TenantThemeContext } from './TenantThemeContext'

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

function buildThemeCSS(theme: TenantTheme): string {
  const vars: string[] = []

  if (theme.accentColor) {
    vars.push(`  --color-accent: ${theme.accentColor};`)
    const rgb = hexToRgb(theme.accentColor)
    vars.push(`  --color-border: rgba(${rgb}, 0.12);`)
    vars.push(`  --color-border-strong: rgba(${rgb}, 0.28);`)
    vars.push(`  --color-bg-soft: rgba(${rgb}, 0.08);`)
    vars.push(`  --color-bg-muted: rgba(${rgb}, 0.04);`)
    vars.push(`  --shadow-surface: 0 4px 20px rgba(${rgb}, 0.09);`)
    vars.push(`  --shadow-drawer: 0 8px 32px rgba(${rgb}, 0.15);`)
  }

  if (theme.accentStrongColor) {
    vars.push(`  --color-accent-strong: ${theme.accentStrongColor};`)
  }

  if (theme.ctaColor) {
    vars.push(`  --color-cta: ${theme.ctaColor};`)
  }

  if (theme.bgColor) {
    vars.push(`  --color-bg: ${theme.bgColor};`)
  }

  if (theme.textColor) {
    vars.push(`  --color-text: ${theme.textColor};`)
  }

  if (theme.fontFamily) {
    vars.push(`  --font-ui: ${theme.fontFamily};`)
  }

  if (vars.length === 0) return ''
  return `:root {\n${vars.join('\n')}\n}`
}

type TenantThemeProviderProps = PropsWithChildren<{
  theme?: TenantTheme | null
}>

export function TenantThemeProvider({ theme, children }: TenantThemeProviderProps) {
  const rawId = useId()
  const styleId = `tenant-theme-${rawId.replace(/:/g, '')}`

  useEffect(() => {
    if (!theme) return

    const css = buildThemeCSS(theme)
    if (!css) return

    const styleEl = document.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = css
    document.head.appendChild(styleEl)

    return () => {
      document.getElementById(styleId)?.remove()
    }
  }, [theme, styleId])

  return (
    <TenantThemeContext.Provider value={{ theme: theme ?? null }}>
      {children}
    </TenantThemeContext.Provider>
  )
}
