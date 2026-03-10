import { NavLink } from 'react-router-dom'

type SiteHeaderProps = {
  section: 'public' | 'org'
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/t/acme-training/courses', label: 'Courses' },
  { to: '/org/login', label: 'Org Portal' },
]

const orgLinks = [
  { to: '/org/submissions', label: 'Submissions' },
  { to: '/org/audit', label: 'Audit' },
  { to: '/org/branding', label: 'Branding' },
]

export function SiteHeader({ section }: SiteHeaderProps) {
  const links = section === 'org' ? orgLinks : publicLinks

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
      </div>
    </header>
  )
}
