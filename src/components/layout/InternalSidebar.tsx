import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/internal', label: 'Home', end: true },
  { to: '/internal/tenants', label: 'Tenants' },
  { to: '/internal/users', label: 'Users' },
]

export function InternalSidebar() {
  return (
    <aside className="portal-sidebar">
      <Link className="portal-sidebar__brand" to="/">
        OnlineForms
      </Link>
      <nav aria-label="Internal portal" className="portal-sidebar__nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
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
