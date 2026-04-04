import type { ReactNode } from 'react'

type PageHeroProps = {
  badge?: string
  badgeOutlined?: boolean
  title: string
  description: string
  aside?: ReactNode
  variant?: 'default' | 'public' | 'org'
}

export function PageHero({
  badge,
  badgeOutlined,
  title,
  description,
  aside,
  variant,
}: PageHeroProps) {
  const heroClass =
    variant === 'public'
      ? 'page-hero page-hero--public'
      : variant === 'org'
        ? 'page-hero page-hero--org'
        : 'page-hero'
  const badgeClass =
    variant === 'org'
      ? 'page-hero__badge page-hero__badge--circle'
      : badgeOutlined
        ? 'page-hero__badge page-hero__badge--outlined'
        : 'page-hero__badge'

  return (
    <section className={heroClass}>
      <div className="page-hero__content">
        {badge ? <span className={badgeClass}>{badge}</span> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {aside ? <div className="page-hero__aside">{aside}</div> : null}
    </section>
  )
}
