import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  ApiClientError,
  createEnrollment,
  type EnrollmentResponse,
  type FormField,
  type FormSchema,
} from '../../lib/api'
import {
  createEnrollmentMeta,
  normalizeEnrollmentAnswers,
} from './submission'

type FormPreviewProps = {
  schema: FormSchema | null
  tenantCode: string
  courseId: string
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

export function FormPreview({
  schema,
  tenantCode,
  courseId,
}: FormPreviewProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Record<string, unknown>>()
  const enrollmentMutation = useMutation<
    EnrollmentResponse,
    ApiClientError,
    Record<string, unknown>
  >({
    mutationFn: async (values) => {
      if (!schema) {
        throw new ApiClientError(
          400,
          {
            error: {
              code: 'form_schema_missing',
              message: 'No active enrollment form is available for this course.',
            },
          },
          'No active enrollment form is available for this course.',
        )
      }

      const response = await createEnrollment(tenantCode, courseId, {
        formVersion: schema.version,
        answers: normalizeEnrollmentAnswers(values),
        meta: createEnrollmentMeta(),
      })

      return response.data
    },
    onSuccess() {
      reset()
    },
  })

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

  const onSubmit = handleSubmit((values) => {
    enrollmentMutation.mutate(values)
  })

  if (enrollmentMutation.isSuccess) {
    return (
      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Enrollment submitted</p>
          <h2>Your application was received</h2>
        </div>
        <p>
          Submission ID: <strong>{enrollmentMutation.data.submissionId}</strong>
        </p>
        <p>
          Status: <strong>{enrollmentMutation.data.status}</strong>
        </p>
        <div className="button-row">
          <button
            className="button button--secondary"
            onClick={() => enrollmentMutation.reset()}
            type="button"
          >
            Submit another response
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="content-panel">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Enrollment form</p>
        <h2>Version {schema.version}</h2>
      </div>

      <form className="enrollment-form" onSubmit={onSubmit}>
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
            {errors[field.fieldId] ? (
              <small className="enrollment-form__error">
                This field is required or invalid.
              </small>
            ) : null}
          </label>
        ))}

        {enrollmentMutation.isError ? (
          <div className="enrollment-form__banner" role="alert">
            <strong>{enrollmentMutation.error.message}</strong>
            {import.meta.env.DEV ? (
              <span>
                {enrollmentMutation.error.code
                  ? ` (${enrollmentMutation.error.code})`
                  : ''}
                {enrollmentMutation.error.correlationId
                  ? ` correlation ${enrollmentMutation.error.correlationId}`
                  : ''}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="enrollment-form__actions">
          <button
            className="button button--primary"
            disabled={enrollmentMutation.isPending}
            type="submit"
          >
            {enrollmentMutation.isPending ? 'Submitting...' : 'Submit enrollment'}
          </button>
        </div>
      </form>
    </section>
  )
}
