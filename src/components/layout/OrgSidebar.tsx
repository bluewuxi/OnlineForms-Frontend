import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/org/courses', label: 'Courses' },
  { to: '/org/submissions', label: 'Submissions' },
  { to: '/org/branding', label: 'Branding' },
  { to: '/org/audit', label: 'Audit' },
  { to: '/org/settings', label: 'Settings' },
]

export function OrgSidebar() {
  return (
    <aside className="portal-sidebar">
      <Link className="portal-sidebar__brand" to="/">
        OnlineForms
      </Link>
      <nav aria-label="Org portal" className="portal-sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive
                ? 'portal-sidebar__item portal-sidebar__item--active'
                : 'portal-sidebar__item'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
