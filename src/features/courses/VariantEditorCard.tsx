import { type FormEvent, useState } from 'react'
import type {
  CourseVariant,
  CourseVariantCreatePayload,
  CourseVariantUpdatePayload,
  DeliveryMode,
} from '../../lib/api/types'

type VariantFormState = {
  title: string
  description: string
  startDate: string
  endDate: string
  deliveryMode: DeliveryMode
  locationText: string
  capacity: string
  price: string
  displayOrder: string
}

function toFormState(variant: CourseVariant): VariantFormState {
  return {
    title: variant.title,
    description: variant.description ?? '',
    startDate: variant.startDate,
    endDate: variant.endDate,
    deliveryMode: variant.deliveryMode,
    locationText: variant.locationText ?? '',
    capacity: variant.capacity?.toString() ?? '',
    price: variant.price?.toString() ?? '',
    displayOrder: variant.displayOrder.toString(),
  }
}

const defaultFormState: VariantFormState = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  deliveryMode: 'online',
  locationText: '',
  capacity: '',
  price: '',
  displayOrder: '0',
}

function toPayload(state: VariantFormState): CourseVariantCreatePayload {
  return {
    title: state.title.trim(),
    description: state.description.trim() || null,
    startDate: state.startDate,
    endDate: state.endDate,
    deliveryMode: state.deliveryMode,
    locationText: state.locationText.trim() || null,
    capacity: state.capacity ? Number(state.capacity) : null,
    price: state.price ? Number(state.price) : null,
    displayOrder: state.displayOrder ? Number(state.displayOrder) : 0,
  }
}

type NewVariantCardProps = {
  onSave: (payload: CourseVariantCreatePayload) => void
  onCancel: () => void
  isSaving: boolean
}

export function NewVariantCard({ onSave, onCancel, isSaving }: NewVariantCardProps) {
  const [draft, setDraft] = useState<VariantFormState>(defaultFormState)

  function updateField<K extends keyof VariantFormState>(key: K, value: VariantFormState[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(toPayload(draft))
  }

  return (
    <div className="variant-editor-card variant-editor-card--new">
      <form className="session-form" onSubmit={handleSubmit}>
        <VariantFormFields draft={draft} updateField={updateField} disabled={isSaving} />
        <div className="button-row">
          <button type="submit" className="button button--primary" disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Add variant'}
          </button>
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

type VariantEditorCardProps = {
  variant: CourseVariant
  onSave: (variantId: string, payload: CourseVariantUpdatePayload) => void
  onDelete: (variantId: string) => void
  isSaving: boolean
  isDeleting: boolean
  canWrite: boolean
}

export function VariantEditorCard({
  variant,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  canWrite,
}: VariantEditorCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<VariantFormState>(() => toFormState(variant))
  const [confirmDelete, setConfirmDelete] = useState(false)

  function updateField<K extends keyof VariantFormState>(key: K, value: VariantFormState[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave(variant.id, toPayload(draft))
    setIsEditing(false)
  }

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete(variant.id)
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
    }
  }

  if (isEditing) {
    return (
      <div className="variant-editor-card variant-editor-card--editing">
        <form className="session-form" onSubmit={handleSubmit}>
          <VariantFormFields draft={draft} updateField={updateField} disabled={isSaving} />
          <div className="button-row">
            <button type="submit" className="button button--primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save variant'}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setDraft(toFormState(variant))
                setIsEditing(false)
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="variant-editor-card">
      <div className="variant-editor-card__header">
        <div>
          <strong>{variant.title}</strong>
          <span className="variant-editor-card__meta">
            {variant.startDate} – {variant.endDate} · {variant.deliveryMode}
            {variant.locationText ? ` · ${variant.locationText}` : ''}
          </span>
        </div>
        {canWrite ? (
          <div className="button-row">
            <button
              type="button"
              className="button button--secondary button--small"
              onClick={() => {
                setDraft(toFormState(variant))
                setIsEditing(true)
                setConfirmDelete(false)
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className={`button button--small ${confirmDelete ? 'button--danger' : 'button--secondary'}`}
              onClick={handleDeleteClick}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
            {confirmDelete ? (
              <button
                type="button"
                className="button button--secondary button--small"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {variant.description ? (
        <p className="variant-editor-card__description">{variant.description}</p>
      ) : null}
    </div>
  )
}

type VariantFormFieldsProps = {
  draft: VariantFormState
  updateField: <K extends keyof VariantFormState>(key: K, value: VariantFormState[K]) => void
  disabled: boolean
}

function VariantFormFields({ draft, updateField, disabled }: VariantFormFieldsProps) {
  return (
    <>
      <label className="session-form__field">
        <span>Variant title</span>
        <input
          disabled={disabled}
          onChange={(event) => updateField('title', event.target.value)}
          placeholder="e.g. Morning Session, Online Option"
          type="text"
          value={draft.title}
          required
        />
      </label>
      <label className="session-form__field">
        <span>Variant description (appended to course description)</span>
        <textarea
          className="designer-textarea"
          disabled={disabled}
          onChange={(event) => updateField('description', event.target.value)}
          rows={3}
          value={draft.description}
        />
      </label>
      <div className="field-grid field-grid--course-dates">
        <label className="session-form__field">
          <span>Start date</span>
          <input
            disabled={disabled}
            onChange={(event) => updateField('startDate', event.target.value)}
            type="date"
            value={draft.startDate}
            required
          />
        </label>
        <label className="session-form__field">
          <span>End date</span>
          <input
            disabled={disabled}
            onChange={(event) => updateField('endDate', event.target.value)}
            type="date"
            value={draft.endDate}
            required
          />
        </label>
      </div>
      <label className="session-form__field">
        <span>Delivery mode</span>
        <select
          disabled={disabled}
          onChange={(event) => updateField('deliveryMode', event.target.value as DeliveryMode)}
          value={draft.deliveryMode}
        >
          <option value="online">Online</option>
          <option value="onsite">Onsite</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </label>
      <label className="session-form__field">
        <span>Location (for onsite / hybrid)</span>
        <input
          disabled={disabled}
          onChange={(event) => updateField('locationText', event.target.value)}
          type="text"
          value={draft.locationText}
        />
      </label>
      <div className="field-grid field-grid--course-dates">
        <label className="session-form__field">
          <span>Capacity</span>
          <input
            disabled={disabled}
            min={1}
            onChange={(event) => updateField('capacity', event.target.value)}
            type="number"
            value={draft.capacity}
          />
        </label>
        <label className="session-form__field">
          <span>Price (reserved — not yet active)</span>
          <input
            disabled
            min={0}
            onChange={(event) => updateField('price', event.target.value)}
            placeholder="Reserved for future use"
            type="number"
            value={draft.price}
          />
        </label>
        <label className="session-form__field">
          <span>Display order</span>
          <input
            disabled={disabled}
            min={0}
            onChange={(event) => updateField('displayOrder', event.target.value)}
            type="number"
            value={draft.displayOrder}
          />
        </label>
      </div>
    </>
  )
}
