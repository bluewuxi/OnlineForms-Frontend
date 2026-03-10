type LoadingStateProps = {
  title: string
  message: string
}

export function LoadingState({ title, message }: LoadingStateProps) {
  return (
    <section className="state-card state-card--loading" aria-live="polite">
      <p className="state-card__eyebrow">Loading state</p>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="state-card__skeleton" aria-hidden="true" />
    </section>
  )
}
