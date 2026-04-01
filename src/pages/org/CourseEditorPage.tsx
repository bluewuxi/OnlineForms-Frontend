import { useMutation, useQuery } from '@tanstack/react-query'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { OrgWorkspaceNav } from '../../components/layout/OrgWorkspaceNav'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  archiveCourse,
  type CourseStatus,
  createCourse,
  getCourse,
  publishCourse,
  updateCourse,
  type DeliveryMode,
  type OrgCourse,
  type OrgCourseCreateResponse,
  type OrgCourseStatusResponse,
  type OrgCourseUpdatePayload,
  type OrgCourseUpsertPayload,
  type OrgSessionHeaders,
  type PricingMode,
} from '../../lib/api'

type CourseFormState = {
  title: string
  shortDescription: string
  fullDescription: string
  startDate: string
  endDate: string
  enrollmentOpenAt: string
  enrollmentCloseAt: string
  deliveryMode: DeliveryMode
  locationText: string
  capacity: string
  pricingMode: PricingMode
  imageAssetId: string
  publicVisible: boolean
}

type CourseEditorFormProps = {
  courseId?: string
  initialCourse?: OrgCourse
  initialDraft: CourseFormState
  isCreateMode: boolean
  session: OrgSessionHeaders
}

const defaultCourseFormState: CourseFormState = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  startDate: '',
  endDate: '',
  enrollmentOpenAt: '',
  enrollmentCloseAt: '',
  deliveryMode: 'online',
  locationText: '',
  capacity: '',
  pricingMode: 'free',
  imageAssetId: '',
  publicVisible: false,
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function toDateTimeIso(value: string) {
  if (!value) {
    return ''
  }

  return new Date(value).toISOString()
}

function toCourseFormState(course: OrgCourse): CourseFormState {
  return {
    title: course.title,
    shortDescription: course.shortDescription,
    fullDescription: course.fullDescription,
    startDate: course.startDate,
    endDate: course.endDate,
    enrollmentOpenAt: toDateTimeLocalValue(course.enrollmentOpenAt),
    enrollmentCloseAt: toDateTimeLocalValue(course.enrollmentCloseAt),
    deliveryMode: course.deliveryMode,
    locationText: course.locationText || '',
    capacity: course.capacity?.toString() || '',
    pricingMode: course.pricingMode,
    imageAssetId: course.imageAssetId || '',
    publicVisible: course.publicVisible,
  }
}

function toCreatePayload(state: CourseFormState): OrgCourseUpsertPayload {
  return {
    title: state.title.trim(),
    shortDescription: state.shortDescription.trim(),
    fullDescription: state.fullDescription.trim(),
    startDate: state.startDate,
    endDate: state.endDate,
    enrollmentOpenAt: toDateTimeIso(state.enrollmentOpenAt),
    enrollmentCloseAt: toDateTimeIso(state.enrollmentCloseAt),
    deliveryMode: state.deliveryMode,
    locationText: state.locationText.trim() || null,
    capacity: state.capacity ? Number(state.capacity) : null,
    pricingMode: state.pricingMode,
    imageAssetId: state.imageAssetId.trim() || null,
  }
}

function toUpdatePayload(state: CourseFormState): OrgCourseUpdatePayload {
  return {
    ...toCreatePayload(state),
    publicVisible: state.publicVisible,
  }
}

function isDraftEqual(left: CourseFormState, right: CourseFormState) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function CourseEditorForm({
  courseId,
  initialCourse,
  initialDraft,
  isCreateMode,
  session,
}: CourseEditorFormProps) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<CourseFormState>(initialDraft)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [workflowState, setWorkflowState] = useState<{
    status: CourseStatus
    publicVisible: boolean
  }>({
    status: initialCourse?.status ?? 'draft',
    publicVisible: initialCourse?.publicVisible ?? false,
  })
  const hasUnsavedChanges = !isDraftEqual(draft, initialDraft)

  const createMutation = useMutation<
    OrgCourseCreateResponse,
    ApiClientError,
    OrgCourseUpsertPayload
  >({
    mutationFn: async (payload) => {
      const response = await createCourse(session, payload)
      return response.data
    },
    onMutate: () => {
      setSaveMessage(null)
    },
    onSuccess: (result) => {
      setSaveMessage(`Course created as ${result.status}. Redirecting to detail.`)
      navigate(`/org/courses/${result.id}`, { replace: true })
    },
  })

  const updateMutation = useMutation<OrgCourse, ApiClientError, OrgCourseUpdatePayload>({
    mutationFn: async (payload) => {
      if (!courseId) {
        throw new Error('Missing course context.')
      }

      const response = await updateCourse(session, courseId, payload)
      return response.data
    },
    onMutate: () => {
      setSaveMessage(null)
    },
    onSuccess: (course) => {
      setDraft(toCourseFormState(course))
      setWorkflowState({
        status: course.status,
        publicVisible: course.publicVisible,
      })
      setSaveMessage(`Course updated. Current status: ${course.status}.`)
    },
  })

  const publishMutation = useMutation<
    OrgCourseStatusResponse,
    ApiClientError,
    void
  >({
    mutationFn: async () => {
      if (!courseId) {
        throw new Error('Missing course context.')
      }

      const response = await publishCourse(session, courseId)
      return response.data
    },
    onMutate: () => {
      setSaveMessage(null)
    },
    onSuccess: (result) => {
      setWorkflowState({
        status: result.status,
        publicVisible: result.publicVisible,
      })
      setDraft((current) => ({
        ...current,
        publicVisible: result.publicVisible,
      }))
      setSaveMessage('Course published successfully.')
    },
  })

  const archiveMutation = useMutation<
    OrgCourseStatusResponse,
    ApiClientError,
    void
  >({
    mutationFn: async () => {
      if (!courseId) {
        throw new Error('Missing course context.')
      }

      const response = await archiveCourse(session, courseId)
      return response.data
    },
    onMutate: () => {
      setSaveMessage(null)
    },
    onSuccess: (result) => {
      setWorkflowState({
        status: result.status,
        publicVisible: result.publicVisible,
      })
      setDraft((current) => ({
        ...current,
        publicVisible: result.publicVisible,
      }))
      setSaveMessage('Course archived successfully.')
    },
  })

  function updateField<Key extends keyof CourseFormState>(
    key: Key,
    value: CourseFormState[Key],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isCreateMode) {
      createMutation.mutate(toCreatePayload(draft))
      return
    }

    updateMutation.mutate(toUpdatePayload(draft))
  }

  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    publishMutation.error ||
    archiveMutation.error
  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending ||
    archiveMutation.isPending

  return (
    <section className="content-panel">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Course editor</p>
        <h2>Core course settings</h2>
      </div>
      {!isCreateMode ? (
        <div className="detail-summary-grid">
          <div className="field-card">
            <span>Status</span>
            <strong>{workflowState.status}</strong>
          </div>
          <div className="field-card">
            <span>Visibility</span>
            <strong>{workflowState.publicVisible ? 'Public' : 'Internal only'}</strong>
          </div>
        </div>
      ) : null}
      <form className="session-form" onSubmit={handleSubmit}>
        <label className="session-form__field">
          <span>Title</span>
          <input
            onChange={(event) => updateField('title', event.target.value)}
            type="text"
            value={draft.title}
          />
        </label>
        <label className="session-form__field">
          <span>Short description</span>
          <textarea
            className="designer-textarea"
            onChange={(event) => updateField('shortDescription', event.target.value)}
            rows={3}
            value={draft.shortDescription}
          />
        </label>
        <label className="session-form__field">
          <span>Full description</span>
          <textarea
            className="designer-textarea"
            onChange={(event) => updateField('fullDescription', event.target.value)}
            rows={5}
            value={draft.fullDescription}
          />
        </label>
        <div className="field-grid field-grid--course-dates">
          <label className="session-form__field">
            <span>Start date</span>
            <input
              onChange={(event) => updateField('startDate', event.target.value)}
              type="date"
              value={draft.startDate}
            />
          </label>
          <label className="session-form__field">
            <span>End date</span>
            <input
              onChange={(event) => updateField('endDate', event.target.value)}
              type="date"
              value={draft.endDate}
            />
          </label>
          <label className="session-form__field">
            <span>Enrollment opens</span>
            <input
              onChange={(event) => updateField('enrollmentOpenAt', event.target.value)}
              type="datetime-local"
              value={draft.enrollmentOpenAt}
            />
          </label>
          <label className="session-form__field">
            <span>Enrollment closes</span>
            <input
              onChange={(event) => updateField('enrollmentCloseAt', event.target.value)}
              type="datetime-local"
              value={draft.enrollmentCloseAt}
            />
          </label>
        </div>

        <div className="field-grid field-grid--course-settings">
          <label className="session-form__field">
            <span>Delivery mode</span>
            <select
              onChange={(event) =>
                updateField('deliveryMode', event.target.value as DeliveryMode)
              }
              value={draft.deliveryMode}
            >
              <option value="online">Online</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="session-form__field">
            <span>Pricing mode</span>
            <select
              onChange={(event) =>
                updateField('pricingMode', event.target.value as PricingMode)
              }
              value={draft.pricingMode}
            >
              <option value="free">Free</option>
              <option value="paid_placeholder">Paid placeholder</option>
            </select>
          </label>
          <label className="session-form__field session-form__field--wide">
            <span>Location</span>
            <input
              onChange={(event) => updateField('locationText', event.target.value)}
              type="text"
              value={draft.locationText}
            />
          </label>
          <label className="session-form__field">
            <span>Capacity</span>
            <input
              onChange={(event) => updateField('capacity', event.target.value)}
              type="number"
              value={draft.capacity}
            />
          </label>
          <label className="session-form__field">
            <span>Image asset ID</span>
            <input
              onChange={(event) => updateField('imageAssetId', event.target.value)}
              type="text"
              value={draft.imageAssetId}
            />
          </label>
        </div>

        {!isCreateMode ? (
          <label className="designer-checkbox-row">
            <input
              checked={draft.publicVisible}
              onChange={(event) => updateField('publicVisible', event.target.checked)}
              type="checkbox"
            />
            <span>Mark course as public visible</span>
          </label>
        ) : null}

        {hasUnsavedChanges ? (
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>Course draft has unsaved changes.</strong>
            <span>Save the course before moving on to publish or form design tasks.</span>
          </div>
        ) : null}

        {mutationError ? (
          <div className="designer-banner designer-banner--error" role="alert">
            <strong>{mutationError.message}</strong>
            <span>Review the course details and retry the save.</span>
          </div>
        ) : null}

        {saveMessage ? (
          <div className="designer-banner designer-banner--success" role="status">
            <strong>Course saved successfully.</strong>
            <span>{saveMessage}</span>
          </div>
        ) : null}

        <div className="button-row">
          <button
            className="button button--primary"
            disabled={isSaving || !hasUnsavedChanges}
            type="submit"
          >
            {isSaving
              ? 'Saving course...'
              : isCreateMode
                ? 'Create course'
                : 'Save changes'}
          </button>
          <Link className="button button--secondary" to="/org/courses">
            Back to courses
          </Link>
          {!isCreateMode && courseId ? (
            <>
              <button
                className="button button--secondary"
                disabled={isSaving || workflowState.status !== 'draft'}
                onClick={() => publishMutation.mutate()}
                type="button"
              >
                Publish course
              </button>
              <button
                className="button button--ghost"
                disabled={isSaving || workflowState.status !== 'published'}
                onClick={() => archiveMutation.mutate()}
                type="button"
              >
                Archive course
              </button>
            </>
          ) : null}
          {!isCreateMode && courseId ? (
            <Link className="button button--ghost" to={`/org/courses/${courseId}/form`}>
              Open form designer
            </Link>
          ) : null}
        </div>
      </form>
    </section>
  )
}

export function CourseEditorPage() {
  const { session } = useOrgSession()
  const { courseId } = useParams()
  const isCreateMode = !courseId || courseId === 'new'

  const courseQuery = useQuery({
    queryKey: ['org-course', session?.tenantId, courseId],
    queryFn: async () => {
      if (!session || !courseId) {
        throw new Error('Missing org session or course context.')
      }

      const response = await getCourse(session, courseId)
      return response.data
    },
    enabled: Boolean(session && courseId && !isCreateMode),
  })

  const initialDraft = useMemo(
    () =>
      isCreateMode
        ? defaultCourseFormState
        : courseQuery.data
          ? toCourseFormState(courseQuery.data)
          : defaultCourseFormState,
    [courseQuery.data, isCreateMode],
  )

  return (
    <div className="page-stack">
      <PageHero
        badge={isCreateMode ? 'Course setup' : 'Course details'}
        title={
          isCreateMode
            ? 'Create tenant course'
            : courseQuery.data?.title || 'Edit tenant course'
        }
        description="Maintain the core course record here, then move directly into the linked form-design and publish workflow."
      />

      {session ? (
        <OrgWorkspaceNav
          eyebrow="Course workflow"
          title="Keep authoring in one connected flow"
          items={[
            {
              label: 'Course details',
              description: isCreateMode
                ? 'Finish the draft setup before moving on.'
                : 'Update course metadata, dates, and delivery settings.',
              to: isCreateMode ? '/org/courses/new' : `/org/courses/${courseId}`,
              state: 'current',
            },
            {
              label: 'Form designer',
              description: isCreateMode
                ? 'Available after the first course save.'
                : 'Design or revise the enrolment form linked to this course.',
              to: !isCreateMode && courseId ? `/org/courses/${courseId}/form` : undefined,
            },
            {
              label: 'Back to course list',
              description: 'Return to the course workspace and open another intake.',
              to: '/org/courses',
            },
          ]}
        />
      ) : null}

      {!isCreateMode && courseQuery.isLoading ? (
        <LoadingState
          title="Loading course detail"
          message="Fetching the selected course before rendering the edit workflow."
        />
      ) : null}

      {!isCreateMode && courseQuery.isError ? (
        <ErrorState
          title="We could not load this course"
          message="The selected course could not be loaded for editing."
        />
      ) : null}

      {(isCreateMode || (!courseQuery.isLoading && !courseQuery.isError)) && session ? (
        <CourseEditorForm
          key={`${courseId || 'new'}-${courseQuery.data?.updatedAt || 'draft'}`}
          courseId={courseId}
          initialCourse={courseQuery.data}
          initialDraft={initialDraft}
          isCreateMode={isCreateMode}
          session={session}
        />
      ) : null}
    </div>
  )
}
