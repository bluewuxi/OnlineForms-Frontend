import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
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
  courseTitle?: string
  enrollmentStatus?: 'upcoming' | 'open' | 'closed'
  formAvailable?: boolean
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

function getFieldErrorMessage(field: FormField) {
  if (field.required) {
    return `${field.label} is required.`
  }

  return `Enter a valid value for ${field.label}.`
}

export function FormPreview({
  schema,
  tenantCode,
  courseId,
  courseTitle,
  enrollmentStatus,
  formAvailable,
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

  if (enrollmentStatus === 'closed') {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="enrollment-form-shell__state-card">
          <span className="enrollment-form-shell__state-icon">✕</span>
          <strong>Enrolment is closed</strong>
          <p>
            This course is visible for reference, but new applications are not
            being accepted right now.
          </p>
          <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
            Back to course list
          </Link>
        </div>
      </section>
    )
  }

  if (enrollmentStatus === 'upcoming') {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="enrollment-form-shell__state-card">
          <span className="enrollment-form-shell__state-icon">○</span>
          <strong>Enrolment opening soon</strong>
          <p>
            Check back when this intake opens. Once enrolment begins, the
            application form will be available on this page.
          </p>
          <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
            Back to course list
          </Link>
        </div>
      </section>
    )
  }

  if (formAvailable === false || !schema || schema.fields.length === 0) {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="enrollment-form-shell__state-card">
          <span className="enrollment-form-shell__state-icon">◌</span>
          <strong>Application form not available</strong>
          <p>
            This course does not have an active public application form
            available for submission yet.
          </p>
          <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
            Back to course list
          </Link>
        </div>
      </section>
    )
  }

  const onSubmit = handleSubmit((values) => {
    enrollmentMutation.mutate(values)
  })

  if (enrollmentMutation.isSuccess) {
    return (
      <section className="content-panel enrollment-form-shell enrollment-form-shell--success">
        <div className="enrollment-form-shell__state-card">
          <h3>Application submitted</h3>
          <p>{courseTitle ?? enrollmentMutation.data.courseTitle ?? ''}</p>
          <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
            Back to courses
          </Link>
        </div>
      </section>
    )
  }

  const requiredCount = schema.fields.filter((field) => field.required).length

  return (
    <section className="content-panel enrollment-form-shell">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Enrolment form</p>
        <h2>Complete your application</h2>
      </div>
      <div className="button-row button-row--spread enrollment-form-shell__intro">
        <p className="content-panel__body-copy">
          Complete the required questions below, then submit your response in one
          step.
        </p>
        <div className="enrollment-form-shell__stats" aria-label="Form summary">
          <span>{schema.fields.length} questions</span>
          <span>{requiredCount} required</span>
          <span>Version {schema.version}</span>
        </div>
      </div>

      <form className="enrollment-form" onSubmit={onSubmit}>
        {schema.fields.map((field, index) => (
          <label key={field.fieldId} className="enrollment-form__field enrollment-form__field--card">
            <div className="enrollment-form__field-header">
              <span className="enrollment-form__field-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                {field.label}
                {field.required ? (
                  <span className="enrollment-form__required" aria-label="required"> *</span>
                ) : null}
              </span>
            </div>
            {renderField(field, register)}
            {field.helpText ? (
              <small className="enrollment-form__hint">{field.helpText}</small>
            ) : null}
            {errors[field.fieldId] ? (
              <small className="enrollment-form__field-error">
                {getFieldErrorMessage(field)}
              </small>
            ) : null}
          </label>
        ))}

        {enrollmentMutation.isError ? (
          <div className="enrollment-form__banner" role="alert">
            <strong>{enrollmentMutation.error.message}</strong>
            <span>Check the highlighted answers and try submitting again.</span>
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
            className="button button--primary enrollment-form__submit"
            disabled={enrollmentMutation.isPending}
            type="submit"
          >
            {enrollmentMutation.isPending ? 'Submitting application...' : 'Submit enrolment'}
          </button>
        </div>
      </form>
    </section>
  )
}
