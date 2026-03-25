import type { ReactNode } from 'react'

type FormSectionProps = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
}

export function FormSection({
  eyebrow,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="form-section">
      <header className="form-section__header">
        {eyebrow ? <p className="section-heading__eyebrow">{eyebrow}</p> : null}
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="form-section__body">{children}</div>
    </section>
  )
}
