import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { getLatestFormSchema } from '../../lib/api'

export function FormDesignerPage() {
  const { session } = useOrgSession()
  const { courseId = '' } = useParams()
  const schemaQuery = useQuery({
    queryKey: ['org-form-schema', session?.tenantId, courseId],
    queryFn: async () => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const response = await getLatestFormSchema(session, courseId)
      return response.data
    },
    enabled: Boolean(session && courseId),
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Form designer"
        title="Course form template"
        description="Load the active course form schema and prepare the editor shell for field creation and schema version updates."
        aside={
          <div className="hero-card">
            <p className="hero-card__label">Course context</p>
            <ul className="hero-card__list">
              <li>Course ID: {courseId || 'Not provided'}</li>
              <li>Tenant: {session?.tenantId || 'No active session'}</li>
            </ul>
          </div>
        }
      />

      {schemaQuery.isLoading ? (
        <LoadingState
          title="Loading form schema"
          message="Fetching the latest active form template for this course."
        />
      ) : null}

      {schemaQuery.isError ? (
        <ErrorState
          title="We could not load the form schema"
          message="The selected course may not have an active schema yet, or the org request failed."
        />
      ) : null}

      {!schemaQuery.isLoading && !schemaQuery.isError ? (
        schemaQuery.data?.fields.length ? (
          <>
            <section className="content-panel">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Schema summary</p>
                <h2>Version {schemaQuery.data.version}</h2>
              </div>
              <div className="detail-summary-grid">
                <div className="field-card">
                  <span>Form ID</span>
                  <strong>{schemaQuery.data.id || 'Unavailable'}</strong>
                </div>
                <div className="field-card">
                  <span>Course</span>
                  <strong>{schemaQuery.data.courseId || courseId}</strong>
                </div>
                <div className="field-card">
                  <span>Field count</span>
                  <strong>{schemaQuery.data.fields.length}</strong>
                </div>
              </div>
            </section>

            <section className="content-panel">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Field list</p>
                <h2>Current editor order</h2>
              </div>
              <div className="designer-field-list">
                {schemaQuery.data.fields.map((field) => (
                  <article key={field.fieldId} className="designer-field-card">
                    <div>
                      <p className="designer-field-card__eyebrow">
                        {field.type.replace(/_/g, ' ')}
                      </p>
                      <h3>{field.label}</h3>
                      <p>{field.helpText || 'No helper text set yet.'}</p>
                    </div>
                    <div className="designer-field-card__meta">
                      <span>ID: {field.fieldId}</span>
                      <span>
                        Required: {field.required ? 'Yes' : 'No'}
                      </span>
                      <span>
                        Order: {field.displayOrder ?? 'Not specified'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <EmptyState
            title="No active form fields yet"
            message="This course does not have an active schema loaded into the designer. The editor shell is ready for field creation in the next task."
          />
        )
      ) : null}

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Next editor steps</p>
          <h2>Field editing lands next</h2>
        </div>
        <p>
          The route shell and schema loader are ready. Next we will add field
          creation and editing controls directly in this designer.
        </p>
        <div className="button-row">
          <Link className="button button--secondary" to="/org/submissions">
            Back to org portal
          </Link>
        </div>
      </section>
    </div>
  )
}
