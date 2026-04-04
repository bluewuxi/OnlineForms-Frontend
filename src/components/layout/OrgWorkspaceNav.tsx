import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type OrgWorkspaceNavItem = {
  label: string
  description: string
  to?: string
  state?: 'current' | 'available'
  icon?: ReactNode
}

type OrgWorkspaceNavProps = {
  eyebrow: string
  title: string
  items: OrgWorkspaceNavItem[]
}

export function OrgWorkspaceNav({
  eyebrow,
  title,
  items,
}: OrgWorkspaceNavProps) {
  return (
    <section className="content-panel org-workspace-nav">
      <div className="section-heading">
        <p className="section-heading__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <div className="org-workspace-nav__grid">
        {items.map((item) => {
          const isCurrent = item.state === 'current'
          const className = isCurrent
            ? 'org-workspace-nav__item org-workspace-nav__item--current'
            : 'org-workspace-nav__item'

          const body = (
            <>
              <div className="org-workspace-nav__item-top">
                {item.icon ? (
                  <span className="org-workspace-nav__item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                {isCurrent ? (
                  <span className="org-workspace-nav__active-badge">Active</span>
                ) : null}
              </div>
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </>
          )

          return item.to ? (
            <Link className={className} key={`${item.label}-${item.to}`} to={item.to}>
              {body}
            </Link>
          ) : (
            <div className={className} key={item.label}>
              {body}
            </div>
          )
        })}
      </div>
    </section>
  )
}
