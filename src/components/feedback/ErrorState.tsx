type ErrorStateProps = {
  title: string
  message: string
  retryLabel?: string
  onRetry?: () => void
}

export function ErrorState({
  title,
  message,
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <section className="state-card state-card--error" role="alert">
      <p className="state-card__eyebrow">Error state</p>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <button onClick={onRetry} type="button">
          {retryLabel}
        </button>
      ) : null}
    </section>
  )
}
