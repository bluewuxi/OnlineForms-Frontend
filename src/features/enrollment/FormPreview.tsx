import { useForm } from 'react-hook-form'
import type { FormField, FormSchema } from '../../lib/api'

type FormPreviewProps = {
  schema: FormSchema | null
}

function renderField(
  field: FormField,
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register'],
) {
  const rules = {
    required: field.required,
    minLength: field.validation?.minLength ?? undefined,
    maxLength: field.validation?.maxLength ?? undefined,
    min: field.validation?.min ?? undefined,
    max: field.validation?.max ?? undefined,
    pattern: field.validation?.pattern
      ? new RegExp(field.validation.pattern)
      : undefined,
  }

  switch (field.type) {
    case 'long_text':
      return (
        <textarea
          id={field.fieldId}
          rows={4}
          {...register(field.fieldId, rules)}
        />
      )
    case 'number':
      return <input id={field.fieldId} type="number" {...register(field.fieldId, rules)} />
    case 'email':
      return <input id={field.fieldId} type="email" {...register(field.fieldId, rules)} />
    case 'phone':
      return <input id={field.fieldId} type="tel" {...register(field.fieldId, rules)} />
    case 'date':
      return <input id={field.fieldId} type="date" {...register(field.fieldId, rules)} />
    case 'single_select':
      return (
        <select id={field.fieldId} {...register(field.fieldId, rules)}>
          <option value="">Select an option</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    case 'multi_select':
      return (
        <select id={field.fieldId} multiple {...register(field.fieldId, rules)}>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    case 'checkbox':
      return <input id={field.fieldId} type="checkbox" {...register(field.fieldId, rules)} />
    case 'short_text':
    default:
      return <input id={field.fieldId} type="text" {...register(field.fieldId, rules)} />
  }
}

export function FormPreview({ schema }: FormPreviewProps) {
  const { register } = useForm<Record<string, unknown>>()

  if (!schema || schema.fields.length === 0) {
    return (
      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Enrollment form</p>
          <h2>Enrollment form is not published yet</h2>
        </div>
        <p>
          This course does not have an active public form schema available for
          rendering yet.
        </p>
      </section>
    )
  }

  return (
    <section className="content-panel">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Enrollment form</p>
        <h2>Version {schema.version}</h2>
      </div>

      <form className="enrollment-form" onSubmit={(event) => event.preventDefault()}>
        {schema.fields.map((field) => (
          <label key={field.fieldId} className="enrollment-form__field">
            <span>
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            {renderField(field, register)}
            {field.helpText ? (
              <small className="enrollment-form__hint">{field.helpText}</small>
            ) : null}
          </label>
        ))}

        <div className="enrollment-form__actions">
          <button className="button button--primary" disabled type="submit">
            Submission flow wiring next
          </button>
        </div>
      </form>
    </section>
  )
}
