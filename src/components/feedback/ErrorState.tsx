type ErrorStateProps = {
  title: string
  message: string
  retryLabel?: string
}

export function ErrorState({
  title,
  message,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <section className="state-card state-card--error" role="alert">
      <p className="state-card__eyebrow">Error state</p>
      <h3>{title}</h3>
      <p>{message}</p>
      <button type="button">{retryLabel}</button>
    </section>
  )
}
