import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Turnstile } from '@marsidev/react-turnstile'
import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import {
  ApiClientError,
  createEnrollment,
  createPaymentIntent,
  type EnrollmentResponse,
  type FormField,
  type FormFieldType,
  type FormSchema,
  type PaymentIntentResponse,
} from '../../lib/api'
import {
  createEnrollmentMeta,
  normalizeEnrollmentAnswers,
} from './submission'
import { PaymentStep } from './PaymentStep'

// Lazy-load Stripe once — null if public key is not configured.
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined
const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null

type FormPreviewProps = {
  schema: FormSchema | null
  tenantCode: string
  courseId: string
  courseTitle?: string
  enrollmentStatus?: 'upcoming' | 'open' | 'closed'
  formAvailable?: boolean
  variantId?: string | null
  variantRequired?: boolean
  /** Price in minor units (cents) for the selected variant. null/0 = free. */
  variantPrice?: number | null
}

// FS-01: Default max lengths aligned with backend enforcement (BS-04).
// short_text → 500, long_text → 5000, email → 254 (RFC 5321).
const DEFAULT_MAX_LENGTH: Partial<Record<FormFieldType, number>> = {
  short_text: 500,
  long_text: 5000,
  email: 254,
}

function effectiveMaxLength(field: FormField): number | undefined {
  return field.validation?.maxLength ?? DEFAULT_MAX_LENGTH[field.type]
}

function renderField(
  field: FormField,
  register: ReturnType<typeof useForm<Record<string, unknown>>>['register'],
) {
  const maxLength = effectiveMaxLength(field)
  const rules = {
    required: field.required,
    minLength: field.validation?.minLength ?? undefined,
    // FS-01: Enforce maxLength with a descriptive message so the error state is helpful.
    maxLength:
      maxLength !== undefined
        ? { value: maxLength, message: `${field.label} must be ${maxLength} characters or fewer.` }
        : undefined,
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
          maxLength={maxLength}
          {...register(field.fieldId, rules)}
        />
      )
    case 'number':
      return <input id={field.fieldId} type="number" {...register(field.fieldId, rules)} />
    case 'email':
      return (
        <input
          id={field.fieldId}
          type="email"
          maxLength={maxLength}
          {...register(field.fieldId, rules)}
        />
      )
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
      return (
        <input
          id={field.fieldId}
          type="text"
          maxLength={maxLength}
          {...register(field.fieldId, rules)}
        />
      )
  }
}

function getFieldErrorMessage(field: FormField, errorType?: string) {
  if (errorType === 'maxLength') {
    const max = effectiveMaxLength(field)
    return `${field.label} must be ${max ?? ''} characters or fewer.`
  }
  if (field.required && errorType === 'required') {
    return `${field.label} is required.`
  }
  return `Enter a valid value for ${field.label}.`
}

// FS-04: Feature flags read at module load so they are stable across renders.
const TURNSTILE_ENABLED = import.meta.env.VITE_TURNSTILE_ENABLED !== 'false'
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined

/** Phase of the two-step paid enrollment flow. */
type EnrollmentPhase =
  | 'form'        // filling out the application form
  | 'payment'     // Stripe Elements rendered, awaiting card confirmation
  | 'enrolling'   // calling /enrollments after payment succeeded
  | 'done'        // enrollment confirmed

export function FormPreview({
  schema,
  tenantCode,
  courseId,
  courseTitle,
  enrollmentStatus,
  formAvailable,
  variantId,
  variantRequired,
  variantPrice,
}: FormPreviewProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<Record<string, unknown>>()

  // FS-01: Watch all values for live character counters on long_text fields.
  const watchedValues = useWatch({ control })

  // FS-03: Honeypot field ref — kept outside react-hook-form so it is not
  // included in the schema answers sent to the API.
  const honeypotRef = useRef<HTMLInputElement>(null)
  // FS-03: Fake success state displayed when the honeypot is triggered.
  // The bot believes the submission succeeded; no API call is made.
  const [honeypotSuccess, setHoneypotSuccess] = useState(false)

  // FS-04: Turnstile CAPTCHA token state.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileLoadError, setTurnstileLoadError] = useState(false)

  // Payment phase tracking and payment intent state.
  const [phase, setPhase] = useState<EnrollmentPhase>('form')
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [savedAnswers, setSavedAnswers] = useState<Record<string, unknown> | null>(null)

  const isPaidVariant = typeof variantPrice === 'number' && variantPrice > 0

  // Mutation: create Stripe PaymentIntent (paid flow — step 1 of 2)
  const paymentIntentMutation = useMutation<PaymentIntentResponse, ApiClientError, Record<string, unknown>>({
    mutationFn: async (values) => {
      if (!schema) throw new ApiClientError(400, { error: { code: 'form_schema_missing', message: 'No form schema.' } }, 'No form schema.')
      if (!variantId) throw new ApiClientError(400, { error: { code: 'variant_required', message: 'No variant selected.' } }, 'No variant selected.')
      const response = await createPaymentIntent(tenantCode, courseId, {
        variantId,
        formVersion: schema.version,
        answers: normalizeEnrollmentAnswers(values),
      })
      return response.data
    },
    onSuccess(pi, values) {
      setSavedAnswers(values)
      setPaymentIntent(pi)
      setPhase('payment')
    },
  })

  // Mutation: create enrollment (free flow OR after payment confirmed)
  const enrollmentMutation = useMutation<
    EnrollmentResponse,
    ApiClientError,
    { values: Record<string, unknown>; paymentIntentId?: string }
  >({
    mutationFn: async ({ values, paymentIntentId }) => {
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
        variantId: variantId ?? null,
        paymentIntentId: paymentIntentId ?? null,
        // FS-04: Include CAPTCHA token from Turnstile widget when enabled.
        _captchaToken:
          TURNSTILE_ENABLED && TURNSTILE_SITE_KEY
            ? (turnstileToken ?? undefined)
            : undefined,
        // FS-03: Honeypot flag — always false for legitimate submissions reaching the API.
        _hp: false,
      })

      return response.data
    },
    onSuccess() {
      reset()
      setPhase('done')
    },
  })

  // Callback for free-flow form submit (or initiating the payment PI step for paid).
  const handleFormSubmit = useCallback(
    (values: Record<string, unknown>) => {
      // If the hidden honeypot field was filled, a bot is submitting the form.
      if (honeypotRef.current?.value) {
        setHoneypotSuccess(true)
        return
      }

      if (isPaidVariant) {
        // Paid flow: create PaymentIntent first, then show Stripe Elements.
        paymentIntentMutation.mutate(values)
      } else {
        // Free flow: enroll directly.
        enrollmentMutation.mutate({ values })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPaidVariant, paymentIntentMutation.mutate, enrollmentMutation.mutate],
  )
  const onSubmit = handleSubmit(handleFormSubmit)

  // Callback fired by PaymentStep on card confirmation success.
  function handlePaymentSuccess(confirmedPaymentIntentId: string) {
    setPaymentError(null)
    setPhase('enrolling')
    enrollmentMutation.mutate({ values: savedAnswers ?? {}, paymentIntentId: confirmedPaymentIntentId })
  }

  // Callback fired by PaymentStep on card decline / Stripe error.
  function handlePaymentError(message: string) {
    setPaymentError(message)
  }

  // ---- Early return guards ----

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

  if (variantRequired && !variantId) {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="enrollment-form-shell__state-card">
          <span className="enrollment-form-shell__state-icon">○</span>
          <strong>Select an option above to continue</strong>
          <p>Choose your preferred variant to reveal the application form.</p>
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

  // FS-03: Show fake success for bot submissions alongside real success for humans.
  if (honeypotSuccess || phase === 'done' || enrollmentMutation.isSuccess) {
    return (
      <section className="content-panel enrollment-form-shell enrollment-form-shell--success">
        <div className="enrollment-form-shell__state-card">
          <h3>Application submitted</h3>
          <p>
            {courseTitle ??
              (enrollmentMutation.isSuccess ? enrollmentMutation.data.courseTitle : '') ??
              ''}
          </p>
          <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
            Back to courses
          </Link>
        </div>
      </section>
    )
  }

  // ---- Payment phase: render Stripe Elements ----

  if (phase === 'payment' && paymentIntent && stripePromise) {
    return (
      <section className="content-panel enrollment-form-shell">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Step 2 of 2 — Payment</p>
          <h2>Complete your payment</h2>
        </div>
        <p className="content-panel__body-copy">
          Enter your card details below to complete the enrollment.
        </p>

        {paymentError ? (
          <div className="enrollment-form__banner" role="alert">
            <strong>Payment failed</strong>
            <span>{paymentError}</span>
          </div>
        ) : null}

        {enrollmentMutation.isError ? (
          <div className="enrollment-form__banner" role="alert">
            <strong>{enrollmentMutation.error.message}</strong>
            <span>Your payment was taken but the enrollment could not be recorded. Please contact support with your payment reference.</span>
          </div>
        ) : null}

        <Elements
          stripe={stripePromise}
          options={{ clientSecret: paymentIntent.clientSecret }}
        >
          <PaymentStep
            amount={paymentIntent.amount}
            currency={paymentIntent.currency}
            disabled={enrollmentMutation.isPending}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>

        <div style={{ marginTop: '1rem' }}>
          <button
            className="button button--ghost"
            onClick={() => {
              setPhase('form')
              setPaymentIntent(null)
              setPaymentError(null)
            }}
            type="button"
          >
            ← Back to form
          </button>
        </div>
      </section>
    )
  }

  // ---- Form phase ----

  // FS-02: Distinguish 429 rate-limit errors from generic API errors.
  const isRateLimited =
    (enrollmentMutation.isError && enrollmentMutation.error.status === 429) ||
    (paymentIntentMutation.isError && paymentIntentMutation.error.status === 429)

  const requiredCount = schema.fields.filter((field) => field.required).length

  // FS-04: Disable submit while awaiting a Turnstile token (only when site key is configured).
  const awaitingCaptcha =
    !isPaidVariant && TURNSTILE_ENABLED && !!TURNSTILE_SITE_KEY && !turnstileToken && !turnstileLoadError

  const isSubmitting = enrollmentMutation.isPending || paymentIntentMutation.isPending

  return (
    <section className="content-panel enrollment-form-shell">
      <div className="section-heading">
        <p className="section-heading__eyebrow">{isPaidVariant ? 'Step 1 of 2 — Application' : 'Enrolment form'}</p>
        <h2>Complete your application</h2>
      </div>
      <div className="button-row button-row--spread enrollment-form-shell__intro">
        <p className="content-panel__body-copy">
          {isPaidVariant
            ? 'Complete the form below, then proceed to payment to confirm your enrolment.'
            : 'Complete the required questions below, then submit your response in one step.'}
        </p>
        <div className="enrollment-form-shell__stats" aria-label="Form summary">
          <span>{schema.fields.length} questions</span>
          <span>{requiredCount} required</span>
          <span>Version {schema.version}</span>
        </div>
      </div>

      <form className="enrollment-form" onSubmit={onSubmit}>
        {/* FS-03: Hidden honeypot field — invisible to humans, visible to bots that
            auto-fill all inputs. CSS offscreen positioning is used instead of
            display:none / visibility:hidden because some bots detect those. */}
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0 }}
        />

        {schema.fields.map((field, index) => {
          // FS-01: Compute effective max length for live character counter on textareas.
          const maxLen = effectiveMaxLength(field)
          const currentLength =
            field.type === 'long_text'
              ? String(watchedValues?.[field.fieldId] ?? '').length
              : 0
          // Show counter when ≥ 80% of the character limit is reached.
          const showCounter =
            field.type === 'long_text' &&
            maxLen !== undefined &&
            currentLength >= Math.floor(maxLen * 0.8)

          return (
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
              {/* FS-01: Live character counter; aria-live announces updates to screen readers. */}
              {showCounter ? (
                <small className="enrollment-form__char-count" aria-live="polite">
                  {currentLength} / {maxLen}
                </small>
              ) : null}
              {field.helpText ? (
                <small className="enrollment-form__hint">{field.helpText}</small>
              ) : null}
              {errors[field.fieldId] ? (
                <small className="enrollment-form__field-error">
                  {getFieldErrorMessage(field, errors[field.fieldId]?.type)}
                </small>
              ) : null}
            </label>
          )
        })}

        {/* FS-02: Distinct rate-limit error state — no retry button on 429. */}
        {isRateLimited ? (
          <div
            className="enrollment-form__banner enrollment-form__banner--rate-limit"
            role="alert"
          >
            <strong>You&apos;ve submitted too many applications recently</strong>
            <span>
              Please wait a while before trying again. If you believe this is an
              error, contact the training provider.
            </span>
          </div>
        ) : enrollmentMutation.isError || paymentIntentMutation.isError ? (
          <div className="enrollment-form__banner" role="alert">
            <strong>{(enrollmentMutation.error ?? paymentIntentMutation.error)?.message}</strong>
            <span>Check the highlighted answers and try submitting again.</span>
            {import.meta.env.DEV ? (
              <span>
                {(enrollmentMutation.error ?? paymentIntentMutation.error)?.code
                  ? ` (${(enrollmentMutation.error ?? paymentIntentMutation.error)?.code})`
                  : ''}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* FS-04: Cloudflare Turnstile CAPTCHA widget — only for free flow. */}
        {!isPaidVariant && TURNSTILE_ENABLED && TURNSTILE_SITE_KEY ? (
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              setTurnstileToken(token)
              setTurnstileLoadError(false)
            }}
            onError={() => {
              console.warn(
                '[FormPreview] Turnstile failed to load — allowing submission without CAPTCHA token.',
              )
              setTurnstileLoadError(true)
            }}
            onExpire={() => setTurnstileToken(null)}
          />
        ) : null}

        <div className="enrollment-form__actions">
          {/* FS-02: No retry button on 429 — show course navigation instead. */}
          {isRateLimited ? (
            <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
              Back to courses
            </Link>
          ) : (
            <button
              className="button button--primary enrollment-form__submit"
              disabled={isSubmitting || awaitingCaptcha}
              type="submit"
            >
              {isSubmitting
                ? isPaidVariant
                  ? 'Preparing payment...'
                  : 'Submitting application...'
                : awaitingCaptcha
                  ? 'Verifying...'
                  : isPaidVariant
                    ? 'Continue to payment'
                    : 'Submit enrolment'}
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
