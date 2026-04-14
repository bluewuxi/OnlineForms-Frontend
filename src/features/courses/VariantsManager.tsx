import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  type ApiClientError,
  createCourseVariant,
  deleteCourseVariant,
  listCourseVariants,
  updateCourseVariant,
  type CourseVariant,
  type CourseVariantCreatePayload,
  type CourseVariantUpdatePayload,
  type OrgSessionHeaders,
} from '../../lib/api'
import { NewVariantCard, VariantEditorCard } from './VariantEditorCard'

type VariantsManagerProps = {
  courseId: string
  session: OrgSessionHeaders
  canWrite: boolean
}

export function VariantsManager({ courseId, session, canWrite }: VariantsManagerProps) {
  const queryClient = useQueryClient()
  const [showNewForm, setShowNewForm] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const variantsQuery = useQuery({
    queryKey: ['org-course-variants', session.tenantId, courseId],
    queryFn: async () => {
      const response = await listCourseVariants(session, courseId)
      return response.data
    },
  })

  const createMutation = useMutation<CourseVariant, ApiClientError, CourseVariantCreatePayload>({
    mutationFn: async (payload) => {
      const response = await createCourseVariant(session, courseId, payload)
      return response.data
    },
    onSuccess: () => {
      setShowNewForm(false)
      setMutationError(null)
      void queryClient.invalidateQueries({ queryKey: ['org-course-variants', session.tenantId, courseId] })
      void queryClient.invalidateQueries({ queryKey: ['org-course', session.tenantId, courseId] })
    },
    onError: (error) => {
      setMutationError(error.message || 'Failed to create variant.')
    },
  })

  const updateMutation = useMutation<
    CourseVariant,
    ApiClientError,
    { variantId: string; payload: CourseVariantUpdatePayload }
  >({
    mutationFn: async ({ variantId, payload }) => {
      const response = await updateCourseVariant(session, courseId, variantId, payload)
      return response.data
    },
    onSuccess: () => {
      setMutationError(null)
      void queryClient.invalidateQueries({ queryKey: ['org-course-variants', session.tenantId, courseId] })
      void queryClient.invalidateQueries({ queryKey: ['org-course', session.tenantId, courseId] })
    },
    onError: (error) => {
      setMutationError(error.message || 'Failed to update variant.')
    },
  })

  const deleteMutation = useMutation<unknown, ApiClientError, string>({
    mutationFn: async (variantId) => {
      await deleteCourseVariant(session, courseId, variantId)
    },
    onSuccess: () => {
      setMutationError(null)
      void queryClient.invalidateQueries({ queryKey: ['org-course-variants', session.tenantId, courseId] })
      void queryClient.invalidateQueries({ queryKey: ['org-course', session.tenantId, courseId] })
    },
    onError: (error) => {
      setMutationError(error.message || 'Failed to delete variant.')
    },
  })

  const variants = variantsQuery.data ?? []

  return (
    <section className="content-panel">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Course variants</p>
        <h2>Variant options</h2>
      </div>
      <p className="content-panel__body-copy">
        Variants share this course's application form and quote. Each variant can have its own schedule, delivery mode,
        and description (appended to the main course description on the public page).
      </p>

      {variantsQuery.isLoading ? (
        <p>Loading variants…</p>
      ) : null}

      {variantsQuery.isError ? (
        <p className="form-error">Failed to load variants.</p>
      ) : null}

      {mutationError ? (
        <p className="form-error">{mutationError}</p>
      ) : null}

      {variants.length === 0 && !variantsQuery.isLoading ? (
        <p className="content-panel__body-copy">
          No variants yet. When at least one variant is added, applicants will be required to choose one before
          submitting the enrollment form.
        </p>
      ) : null}

      <div className="variants-list">
        {variants.map((variant) => (
          <VariantEditorCard
            key={variant.id}
            variant={variant}
            onSave={(variantId, payload) => updateMutation.mutate({ variantId, payload })}
            onDelete={(variantId) => deleteMutation.mutate(variantId)}
            isSaving={updateMutation.isPending && updateMutation.variables?.variantId === variant.id}
            isDeleting={deleteMutation.isPending && deleteMutation.variables === variant.id}
            canWrite={canWrite}
          />
        ))}
      </div>

      {canWrite ? (
        <div className="button-row" style={{ marginTop: '1rem' }}>
          {showNewForm ? null : (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                setShowNewForm(true)
                setMutationError(null)
              }}
            >
              + Add variant
            </button>
          )}
        </div>
      ) : null}

      {showNewForm && canWrite ? (
        <NewVariantCard
          onSave={(payload) => createMutation.mutate(payload)}
          onCancel={() => setShowNewForm(false)}
          isSaving={createMutation.isPending}
        />
      ) : null}
    </section>
  )
}
