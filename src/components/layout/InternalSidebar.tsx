import { Link, NavLink } from 'react-router-dom'

type InternalSidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { to: '/internal', label: 'Home', end: true },
  { to: '/internal/tenants', label: 'Tenants' },
  { to: '/internal/users', label: 'Users' },
]

export function InternalSidebar({ isOpen, onClose }: InternalSidebarProps) {
  return (
    <aside className={isOpen ? 'portal-sidebar portal-sidebar--open' : 'portal-sidebar'}>
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
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
