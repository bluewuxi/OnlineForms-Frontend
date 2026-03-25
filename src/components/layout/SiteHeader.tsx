import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { startCognitoLogout } from '../../features/org-session/cognito'
import { useOrgSession } from '../../features/org-session/useOrgSession'

type SiteHeaderProps = {
  section: 'public' | 'org' | 'login' | 'internal'
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/management', label: 'Management' },
]

const orgLinks = [
  { to: '/org/courses', label: 'Courses' },
  { to: '/org/submissions', label: 'Submissions' },
  { to: '/org/audit', label: 'Audit' },
  { to: '/org/branding', label: 'Branding' },
]

const loginLinks = [
  { to: '/', label: 'Home' },
]

const internalLinks = [
  { to: '/internal', label: 'Home' },
  { to: '/internal/tenants', label: 'Tenants' },
  { to: '/internal/users', label: 'Users' },
]

function isLikelyGuid(value: string | undefined) {
  if (!value) {
    return false
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

export function SiteHeader({ section }: SiteHeaderProps) {
  const links =
    section === 'org'
      ? orgLinks
      : section === 'login'
        ? loginLinks
        : section === 'internal'
          ? internalLinks
          : publicLinks
  const { session, signOut } = useOrgSession()
  const navigate = useNavigate()
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)
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

  return (
    <header className={`site-header site-header--${section}`}>
      <div className="site-header__inner">
        <NavLink className="site-header__brand" to="/">
          OnlineForms
        </NavLink>
        <nav aria-label="Primary" className="site-header__nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? 'site-header__link site-header__link--active'
                  : 'site-header__link'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        {showSession && session ? (
          <div className="site-header__session" ref={accountMenuRef}>
            <button
              className="site-header__account-trigger"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              onClick={() => setIsAccountMenuOpen((open) => !open)}
            >
              <strong>{sessionLoginName}</strong>
              <span className="site-header__account-subtext">
                {sessionSubtext}
              </span>
            </button>
            {isAccountMenuOpen ? (
              <div className="site-header__account-menu" role="menu">
                <button className="site-header__account-item" type="button" role="menuitem" disabled>
                  Profile (Coming soon)
                </button>
                <button className="site-header__account-item" type="button" role="menuitem" disabled>
                  Settings (Coming soon)
                </button>
                <button
                  className="site-header__account-item"
                  type="button"
                  role="menuitem"
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
