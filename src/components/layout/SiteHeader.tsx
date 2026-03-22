import { NavLink } from 'react-router-dom'
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
  const showSession = section === 'org' || section === 'internal'

  return (
    <header className="site-header">
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
          {section === 'internal' ? (
            <button
              className="site-header__link site-header__link-button"
              onClick={signOut}
              type="button"
            >
              Logout
            </button>
          ) : null}
        </nav>
        {showSession && session ? (
          <div className="site-header__session">
            <span>{session.tenantId || '-'}</span>
            <span>{session.userId}</span>
            {section === 'org' ? (
              <button
                className="button button--ghost"
                onClick={signOut}
                type="button"
              >
                Sign out
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  )
}
