import type { ReactNode } from 'react'

type SectionHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header__copy">
        {eyebrow ? <p className="section-heading__eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="section-header__actions">{actions}</div> : null}
    </div>
  )
}
