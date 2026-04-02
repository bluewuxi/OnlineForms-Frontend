import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { startCognitoLogout } from '../../features/org-session/cognito'
import { useOrgSession } from '../../features/org-session/useOrgSession'

type SiteHeaderProps = {
  section: 'public' | 'org' | 'login' | 'internal'
}

const publicLinks = [
  { to: '/', label: 'Home' },
]

const loginLinks = [
  { to: '/', label: 'Home' },
]

function isLikelyGuid(value: string | undefined) {
  if (!value) {
    return false
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

export function SiteHeader({ section }: SiteHeaderProps) {
  const links =
    section === 'login'
      ? loginLinks
      : section === 'org' || section === 'internal'
        ? null
        : publicLinks
  const { session, signOut } = useOrgSession()
  const navigate = useNavigate()
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)
  const accountTriggerRef = useRef<HTMLButtonElement | null>(null)
  const logoutButtonRef = useRef<HTMLButtonElement | null>(null)
  const showSession = section === 'org' || section === 'internal'
  const sessionUsername = session?.username?.trim()
  const sessionPreferredName = session?.preferredName?.trim()
  const sessionLoginName =
    (sessionUsername && !isLikelyGuid(sessionUsername) ? sessionUsername : '') ||
    session?.userId ||
    ''
  const sessionSubtext =
    (sessionPreferredName &&
    !isLikelyGuid(sessionPreferredName) &&
    sessionPreferredName !== sessionLoginName
      ? sessionPreferredName
      : '') || session?.role || ''

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return
    }
    function onDocumentClick(event: MouseEvent) {
      if (!accountMenuRef.current) {
        return
      }
      if (!accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocumentClick)
    return () => document.removeEventListener('mousedown', onDocumentClick)
  }, [isAccountMenuOpen])

  useEffect(() => {
    if (!isAccountMenuOpen) {
      return
    }
    logoutButtonRef.current?.focus()
  }, [isAccountMenuOpen])

  function closeAccountMenu() {
    setIsAccountMenuOpen(false)
    window.setTimeout(() => {
      accountTriggerRef.current?.focus()
    }, 0)
  }

  return (
    <header className={`site-header site-header--${section}`}>
      <div className="site-header__inner">
        <NavLink className="site-header__brand" to="/">
          OnlineForms
        </NavLink>
        {links ? (
          <nav aria-label="Primary" className="site-header__nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'site-header__link site-header__link--active' : 'site-header__link'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        ) : null}
        {showSession && session ? (
          <div className="site-header__session" ref={accountMenuRef}>
            <button
              className="site-header__account-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              ref={accountTriggerRef}
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' && !isAccountMenuOpen) {
                  event.preventDefault()
                  setIsAccountMenuOpen(true)
                }
              }}
            >
              <strong>{sessionLoginName}</strong>
              <span className="site-header__account-subtext">
                {sessionSubtext}
              </span>
            </button>
            {isAccountMenuOpen ? (
              <div
                className="site-header__account-menu"
                role="menu"
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault()
                    closeAccountMenu()
                  }
                }}
              >
                <button
                  className="site-header__account-item"
                  type="button"
                  role="menuitem"
                  ref={logoutButtonRef}
                  onClick={() => {
                    setIsAccountMenuOpen(false)
                    if (session.authProvider === 'cognito') {
                      signOut()
                      startCognitoLogout()
                      return
                    }
                    navigate('/', { replace: true })
                    window.setTimeout(() => {
                      signOut()
                    }, 0)
                  }}
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
