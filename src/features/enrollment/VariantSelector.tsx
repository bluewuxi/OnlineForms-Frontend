import type { CourseVariant } from '../../lib/api/types'

type VariantSelectorProps = {
  variants: CourseVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
  /** ISO 4217 currency code (lowercase) for displaying prices. */
  currency?: string | null
}

function formatPrice(amount: number, currency?: string | null): string {
  if (!currency) return `${(amount / 100).toFixed(2)}`
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export function VariantSelector({ variants, selectedVariantId, onSelect, currency }: VariantSelectorProps) {
  if (variants.length === 0) return null

  return (
    <section className="content-panel">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Step 1 of 2</p>
        <h2>Choose your preferred option</h2>
      </div>
      <p className="content-panel__body-copy">
        This course is offered in multiple variants. Select the option that suits you before completing the application
        form below.
      </p>
      <div className="variant-selector">
        {variants
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((variant) => {
            const isSelected = variant.id === selectedVariantId
            return (
              <button
                key={variant.id}
                type="button"
                className={`variant-selector__card${isSelected ? ' variant-selector__card--selected' : ''}`}
                onClick={() => onSelect(variant.id)}
                aria-pressed={isSelected}
              >
                <div className="variant-selector__card-header">
                  <strong className="variant-selector__title">{variant.title}</strong>
                  <div className="variant-selector__badges">
                    {typeof variant.price === 'number' && variant.price > 0 ? (
                      <span className="variant-selector__price-badge">
                        {formatPrice(variant.price, currency)}
                      </span>
                    ) : (
                      <span className="variant-selector__price-badge variant-selector__price-badge--free">
                        Free
                      </span>
                    )}
                    {isSelected ? <span className="variant-selector__badge">Selected</span> : null}
                  </div>
                </div>
                <div className="variant-selector__meta">
                  <span>{formatDate(variant.startDate)} – {formatDate(variant.endDate)}</span>
                  <span>{variant.deliveryMode}</span>
                  {variant.locationText ? <span>{variant.locationText}</span> : null}
                  {variant.capacity ? <span>Capacity: {variant.capacity}</span> : null}
                </div>
                {variant.description ? (
                  <p className="variant-selector__description">{variant.description}</p>
                ) : null}
              </button>
            )
          })}
      </div>
    </section>
  )
}
