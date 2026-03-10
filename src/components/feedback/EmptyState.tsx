type EmptyStateProps = {
  title: string
  message: string
  actionLabel?: string
}

export function EmptyState({ title, message, actionLabel }: EmptyStateProps) {
  return (
    <section className="state-card state-card--empty" aria-live="polite">
      <p className="state-card__eyebrow">Empty state</p>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel ? <button type="button">{actionLabel}</button> : null}
    </section>
  )
}
