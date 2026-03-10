type EmptyStateProps = {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <section className="state-card state-card--empty" aria-live="polite">
      <p className="state-card__eyebrow">Empty state</p>
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel ? (
        <button onClick={onAction} type="button">
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}
