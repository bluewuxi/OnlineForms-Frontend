import type { CourseVariant } from '../../lib/api/types'

type VariantSelectorProps = {
  variants: CourseVariant[]
  selectedVariantId: string | null
  onSelect: (variantId: string) => void
}

function formatDate(value?: string | null) {
  if (!value) return 'Not specified'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export function VariantSelector({ variants, selectedVariantId, onSelect }: VariantSelectorProps) {
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
                  {isSelected ? <span className="variant-selector__badge">Selected</span> : null}
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
