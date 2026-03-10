import type { ReactNode } from 'react'

type PageHeroProps = {
  badge?: string
  title: string
  description: string
  aside?: ReactNode
}

export function PageHero({
  badge,
  title,
  description,
  aside,
}: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero__content">
        {badge ? <span className="page-hero__badge">{badge}</span> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside ? <div className="page-hero__aside">{aside}</div> : null}
    </section>
  )
}
