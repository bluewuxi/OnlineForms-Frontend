import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RichText } from '../../components/content/RichText'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { FormPreview } from '../../features/enrollment/FormPreview'
import { parseFormSchema } from '../../features/enrollment/formSchema'
import { VariantSelector } from '../../features/enrollment/VariantSelector'
import { getPublicCourse } from '../../lib/api'
import { normalizeTenantCode } from '../../lib/routing/tenantCode'

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not specified'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function normalizeStatusLabel(value?: string) {
  if (!value) {
    return 'Open'
  }

  if (value === 'upcoming') {
    return 'Opening soon'
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function CourseDetailPage() {
  const { tenantCode: tenantCodeParam, courseId = '' } = useParams()
  const tenantCode = normalizeTenantCode(tenantCodeParam ?? '')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

  const courseQuery = useQuery({
    queryKey: ['public-course', tenantCode, courseId],
    queryFn: async () => {
      const response = await getPublicCourse(tenantCode, courseId)
      return response.data
    },
    enabled: Boolean(courseId),
  })

  const formSchema = parseFormSchema(
    courseQuery.data?.formSchema,
    courseQuery.data?.formVersion,
  )

  const variants = courseQuery.data?.variants ?? []
  const hasVariants = variants.length > 0
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId) ?? null
    : null

  return (
    <div className="page-stack">
      {courseQuery.isLoading ? (
        <LoadingState
          title="Loading course detail"
          message="Fetching the public course information and active enrollment form."
        />
      ) : null}

      {courseQuery.isError ? (
        <ErrorState
          title="We could not load this course"
          message="The course may be unavailable or the public API request failed."
        />
      ) : null}

      {courseQuery.data ? (
        <>
          <PageHero
            badge="Course enrolment"
            title={courseQuery.data.title}
            description={
              courseQuery.data.summary ||
              'Review the course information, confirm the enrolment window, and continue into the application form below.'
            }
            aside={
              <div className="hero-card">
                <p className="hero-card__label">Enrolment window</p>
                <div className="enrollment-window">
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Opens</span>
                    <span className="enrollment-window__value">{formatDate(courseQuery.data.enrollmentOpensAt)}</span>
                  </div>
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Closes</span>
                    <span className="enrollment-window__value">{formatDate(courseQuery.data.enrollmentClosesAt)}</span>
                  </div>
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Status</span>
                    <span className="enrollment-window__value">{normalizeStatusLabel(courseQuery.data.enrollmentStatus)}</span>
                  </div>
                  <div className="enrollment-window__row">
                    <span className="enrollment-window__label">Form</span>
                    <span className="enrollment-window__value">{courseQuery.data.formAvailable === false ? 'Unavailable' : 'Available'}</span>
                  </div>
                </div>
              </div>
            }
          />

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Before you apply</p>
              <h2>Key course facts at a glance</h2>
            </div>
            <div className="detail-summary-grid">
              <div className="field-card">
                <span>Delivery mode</span>
                <strong>{courseQuery.data.deliveryMode || 'Not specified'}</strong>
              </div>
              <div className="field-card">
                <span>Duration</span>
                <strong>{courseQuery.data.durationLabel || 'Not specified'}</strong>
              </div>
              <div className="field-card">
                <span>Location</span>
                <strong>{courseQuery.data.locationText || 'Not specified'}</strong>
              </div>
              <div className="field-card">
                <span>Capacity</span>
                <strong>{courseQuery.data.capacity ?? 'Not specified'}</strong>
              </div>
            </div>
            <div className="button-row button-row--spread">
              <p className="content-panel__body-copy">
                Use the form below when the enrolment window is open and the
                course matches your intended intake.
              </p>
              <Link className="button button--secondary" to={`/${tenantCode}/courses`}>
                Back to catalog
              </Link>
            </div>
          </section>

          {courseQuery.data.description || selectedVariant?.description ? (
            <section className="content-panel">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Course overview</p>
                <h2>What this course covers</h2>
              </div>
              {courseQuery.data.description ? (
                <RichText
                  html={courseQuery.data.description}
                  className="rich-text content-panel__body-copy content-panel__body-copy--wide"
                />
              ) : null}
              {selectedVariant?.description ? (
                <p className="content-panel__body-copy" style={{ marginTop: '1rem' }}>
                  {selectedVariant.description}
                </p>
              ) : null}
            </section>
          ) : null}

          {hasVariants ? (
            <VariantSelector
              variants={variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
            />
          ) : null}

          <FormPreview
            courseId={courseId}
            courseTitle={courseQuery.data.title}
            enrollmentStatus={courseQuery.data.enrollmentStatus}
            formAvailable={courseQuery.data.formAvailable}
            schema={formSchema}
            tenantCode={tenantCode}
            variantId={selectedVariantId}
            variantRequired={hasVariants}
          />
        </>
      ) : null}
    </div>
  )
}
