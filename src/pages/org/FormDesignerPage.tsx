import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  getLatestFormSchema,
  type FormField,
  type FormFieldType,
} from '../../lib/api'

const fieldTypeOptions: Array<{ value: FormFieldType; label: string }> = [
  { value: 'short_text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'single_select', label: 'Single select' },
  { value: 'multi_select', label: 'Multi select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
]

function createDraftField(position: number): FormField {
  return {
    fieldId: `field_${position + 1}`,
    type: 'short_text',
    label: `New field ${position + 1}`,
    helpText: '',
    required: false,
    displayOrder: position + 1,
    options: [],
    validation: {},
  }
}

type FormDesignerEditorProps = {
  courseId: string
  formId?: string
  version?: number
  initialFields: FormField[]
}

function FormDesignerEditor({
  courseId,
  formId,
  version,
  initialFields,
}: FormDesignerEditorProps) {
  const [editableFields, setEditableFields] =
    useState<FormField[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialFields[0]?.fieldId ?? null,
  )

  const selectedField =
    editableFields.find((field) => field.fieldId === selectedFieldId) ?? null

  function updateSelectedField(updater: (field: FormField) => FormField) {
    setEditableFields((currentFields) =>
      currentFields.map((field) =>
        field.fieldId === selectedFieldId ? updater(field) : field,
      ),
    )
  }

  function addField() {
    const nextField = createDraftField(editableFields.length)

    setEditableFields((currentFields) => [...currentFields, nextField])
    setSelectedFieldId(nextField.fieldId)
  }

  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Schema summary</p>
          <h2>Version {version ?? 'Draft'}</h2>
        </div>
        <div className="detail-summary-grid">
          <div className="field-card">
            <span>Form ID</span>
            <strong>{formId || 'Unavailable'}</strong>
          </div>
          <div className="field-card">
            <span>Course</span>
            <strong>{courseId}</strong>
          </div>
          <div className="field-card">
            <span>Field count</span>
            <strong>{editableFields.length}</strong>
          </div>
        </div>
      </section>

      <section className="designer-grid">
        <section className="content-panel">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Field list</p>
            <h2>Editor fields</h2>
          </div>
          <div className="button-row">
            <button className="button button--primary" onClick={addField} type="button">
              Add field
            </button>
          </div>
          {editableFields.length ? (
            <div className="designer-field-list">
              {editableFields.map((field) => (
                <button
                  key={field.fieldId}
                  className={
                    field.fieldId === selectedFieldId
                      ? 'designer-field-card designer-field-card--selected'
                      : 'designer-field-card'
                  }
                  onClick={() => setSelectedFieldId(field.fieldId)}
                  type="button"
                >
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
                </button>
              ))}
            </div>
          ) : (
            <div className="designer-empty-panel">
              <h3>Start your first field</h3>
              <p>
                This course does not have an active form schema yet. Add a
                field to begin the template draft.
              </p>
            </div>
          )}
        </section>

        <section className="content-panel">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Field editor</p>
            <h2>Core field properties</h2>
          </div>
          {selectedField ? (
            <div className="designer-editor-grid">
              <label className="session-form__field">
                <span>Field ID</span>
                <input
                  onChange={(event) =>
                    updateSelectedField((field) => ({
                      ...field,
                      fieldId: event.target.value,
                    }))
                  }
                  type="text"
                  value={selectedField.fieldId}
                />
              </label>
              <label className="session-form__field">
                <span>Label</span>
                <input
                  onChange={(event) =>
                    updateSelectedField((field) => ({
                      ...field,
                      label: event.target.value,
                    }))
                  }
                  type="text"
                  value={selectedField.label}
                />
              </label>
              <label className="session-form__field">
                <span>Help text</span>
                <textarea
                  className="designer-textarea"
                  onChange={(event) =>
                    updateSelectedField((field) => ({
                      ...field,
                      helpText: event.target.value,
                    }))
                  }
                  rows={3}
                  value={selectedField.helpText || ''}
                />
              </label>
              <label className="session-form__field">
                <span>Field type</span>
                <select
                  onChange={(event) =>
                    updateSelectedField((field) => ({
                      ...field,
                      type: event.target.value as FormFieldType,
                    }))
                  }
                  value={selectedField.type}
                >
                  {fieldTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="designer-checkbox-row">
                <input
                  checked={Boolean(selectedField.required)}
                  onChange={(event) =>
                    updateSelectedField((field) => ({
                      ...field,
                      required: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                <span>Required field</span>
              </label>
            </div>
          ) : (
            <div className="designer-empty-panel">
              <h3>No field selected</h3>
              <p>
                Choose an existing field or add a new one to start editing its
                core properties.
              </p>
            </div>
          )}
        </section>
      </section>
    </>
  )
}

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
        <FormDesignerEditor
          key={`${schemaQuery.data?.id || 'draft'}-${schemaQuery.data?.version || 0}-${courseId}`}
          courseId={schemaQuery.data?.courseId || courseId}
          formId={schemaQuery.data?.id}
          initialFields={schemaQuery.data?.fields ?? []}
          version={schemaQuery.data?.version}
        />
      ) : null}

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Next editor steps</p>
          <h2>Validation, options, and save flow land next</h2>
        </div>
        <p>
          Core field editing now works locally. Next we will add option lists,
          ordering controls, validation settings, and schema persistence.
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
