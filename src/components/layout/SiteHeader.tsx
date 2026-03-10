import { NavLink } from 'react-router-dom'
import { useOrgSession } from '../../features/org-session/useOrgSession'

type SiteHeaderProps = {
  section: 'public' | 'org'
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/t/acme-training/courses', label: 'Courses' },
  { to: '/org/login', label: 'Org Portal' },
]

const orgLinks = [
  { to: '/org/courses', label: 'Courses' },
  { to: '/org/submissions', label: 'Submissions' },
  { to: '/org/audit', label: 'Audit' },
  { to: '/org/branding', label: 'Branding' },
  { to: '/org/courses/crs_demo_001/form', label: 'Form Designer' },
]

export function SiteHeader({ section }: SiteHeaderProps) {
  const links = section === 'org' ? orgLinks : publicLinks
  const { session, signOut } = useOrgSession()

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
        </nav>
        {section === 'org' && session ? (
          <div className="site-header__session">
            <span>{session.tenantId}</span>
            <span>{session.userId}</span>
            <button
              className="button button--ghost"
              onClick={signOut}
              type="button"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
