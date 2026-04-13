import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { createFormTemplate, deleteFormTemplate, listFormTemplates } from '../../lib/api'

function formatLocalDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

export function FormTemplatesPage() {
  const { session } = useOrgSession()
  const canWrite = useCanWrite()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  const templatesQuery = useQuery({
    queryKey: ['org-form-templates', session?.tenantId],
    queryFn: async () => {
      if (!session) return []
      const response = await listFormTemplates(session)
      return response.data
    },
    enabled: Boolean(session),
  })

  const duplicateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!session) throw new Error('Missing session.')
      const source = templatesQuery.data?.find((t) => t.templateId === templateId)
      if (!source) throw new Error('Template not found.')
      const response = await createFormTemplate(session, {
        name: `Copy of ${source.name}`,
        description: source.description,
        fields: source.fields,
      })
      return response.data
    },
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['org-form-templates', session?.tenantId] })
      setDuplicatingId(null)
      navigate(`/org/form-templates/${newTemplate.templateId}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      if (!session) throw new Error('Missing session.')
      await deleteFormTemplate(session, templateId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-form-templates', session?.tenantId] })
      setConfirmDeleteId(null)
    },
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Org workspace"
        variant="org"
        title="Form Schema Templates"
        description="Build and maintain reusable field sets that can be applied as a starting point when designing a new course enrollment form."
      />

      {templatesQuery.isLoading ? (
        <LoadingState
          title="Loading templates"
          message="Fetching form schema templates for this tenant."
        />
      ) : null}

      {templatesQuery.isError ? (
        <ErrorState
          title="Could not load templates"
          message="The template list request failed. Check the org session or retry."
        />
      ) : null}

      {!templatesQuery.isLoading && !templatesQuery.isError ? (
        templatesQuery.data?.length ? (
          <section className="content-panel">
            <div className="section-header">
              <div className="section-header__copy">
                <p className="section-heading__eyebrow">Template library</p>
                <h2>
                  {templatesQuery.data.length} template
                  {templatesQuery.data.length !== 1 ? 's' : ''}
                </h2>
              </div>
              {canWrite ? (
                <div className="section-header__actions">
                  <Link className="button button--primary" to="/org/form-templates/new">
                    Create template
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="org-course-card-grid">
              {templatesQuery.data.map((template) => (
                <div key={template.templateId} className="org-course-card">
                  <div className="org-course-card__header">
                    <div className="org-course-card__title-row">
                      <strong className="org-course-card__title">{template.name}</strong>
                    </div>
                    {template.description ? (
                      <p className="org-course-card__summary">{template.description}</p>
                    ) : null}
                  </div>

                  <div className="org-course-card__meta">
                    <span className="org-course-card__meta-item">
                      <span className="org-course-card__meta-label">Fields</span>
                      {template.fields.length}
                    </span>
                    <span className="org-course-card__meta-item">
                      <span className="org-course-card__meta-label">Last updated</span>
                      {formatLocalDate(template.updatedAt)}
                    </span>
                  </div>

                  <div className="org-course-card__actions">
                    {canWrite ? (
                      <Link
                        className="button button--outline"
                        to={`/org/form-templates/${template.templateId}`}
                      >
                        Edit
                      </Link>
                    ) : null}
                    {canWrite ? (
                      <button
                        className="button button--ghost"
                        disabled={duplicatingId === template.templateId}
                        onClick={() => {
                          setDuplicatingId(template.templateId)
                          duplicateMutation.mutate(template.templateId)
                        }}
                        type="button"
                      >
                        {duplicatingId === template.templateId ? 'Duplicating...' : 'Duplicate'}
                      </button>
                    ) : null}

                    {canWrite && confirmDeleteId === template.templateId ? (
                      <div className="button-row">
                        <span style={{ fontSize: '0.875rem', alignSelf: 'center' }}>Delete?</span>
                        <button
                          className="button button--ghost"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(template.templateId)}
                          type="button"
                        >
                          {deleteMutation.isPending ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button
                          className="button button--ghost"
                          onClick={() => setConfirmDeleteId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : canWrite ? (
                      <button
                        className="button button--ghost"
                        onClick={() => setConfirmDeleteId(template.templateId)}
                        type="button"
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>

                  {deleteMutation.isError && confirmDeleteId === template.templateId ? (
                    <div className="designer-banner designer-banner--error" role="alert">
                      <strong>Delete failed.</strong>
                      <span>Could not delete the template. Please try again.</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <EmptyState
            title="No templates yet"
            message={
              canWrite
                ? 'Create a template to define reusable field sets for enrollment forms.'
                : 'No form templates have been created for this tenant yet.'
            }
            actionLabel={canWrite ? 'Create template' : undefined}
            onAction={canWrite ? () => navigate('/org/form-templates/new') : undefined}
          />
        )
      ) : null}
    </div>
  )
}
