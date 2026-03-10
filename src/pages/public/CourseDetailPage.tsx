import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { FormPreview } from '../../features/enrollment/FormPreview'
import { parseFormSchema } from '../../features/enrollment/formSchema'
import { getPublicCourse } from '../../lib/api'

function formatDate(value?: string | null) {
  if (!value) {
    return 'Not specified'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function CourseDetailPage() {
  const { tenantCode = 'acme-training', courseId = '' } = useParams()
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
            badge="Course detail"
            title={courseQuery.data.title}
            description={
              courseQuery.data.description ||
              courseQuery.data.summary ||
              'Review the course information and complete the enrollment form below.'
            }
            aside={
              <div className="hero-card">
                <p className="hero-card__label">Enrollment window</p>
                <ul className="hero-card__list">
                  <li>Opens: {formatDate(courseQuery.data.enrollmentOpensAt)}</li>
                  <li>Closes: {formatDate(courseQuery.data.enrollmentClosesAt)}</li>
                  <li>Status: {courseQuery.data.enrollmentStatus || 'Open'}</li>
                </ul>
              </div>
            }
          />

          <section className="content-panel">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Course overview</p>
              <h2>What applicants need to know</h2>
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
                <span>Form version</span>
                <strong>{courseQuery.data.formVersion ?? formSchema?.version ?? 'N/A'}</strong>
              </div>
            </div>
            <div className="button-row">
              <Link className="button button--secondary" to={`/t/${tenantCode}/courses`}>
                Back to catalog
              </Link>
            </div>
          </section>

          <FormPreview schema={formSchema} />
        </>
      ) : null}
    </div>
  )
}
