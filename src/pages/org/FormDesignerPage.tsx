import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { buildFormSchemaUpsertPayload } from '../../features/form-designer/schemaPayload'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  getLatestFormSchema,
  type FormField,
  type FormFieldType,
  type FormSchema,
  type FormSchemaUpsertResponse,
  type OrgSessionHeaders,
  upsertFormSchema,
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

function withDisplayOrder(fields: FormField[]) {
  return fields.map((field, index) => ({
    ...field,
    displayOrder: index + 1,
  }))
}

type FormDesignerEditorProps = {
  courseId: string
  formId?: string
  version?: number
  initialFields: FormField[]
  queryKey: string[]
  session: OrgSessionHeaders
}

function FormDesignerEditor({
  courseId,
  formId,
  version,
  initialFields,
  queryKey,
  session,
}: FormDesignerEditorProps) {
  const queryClient = useQueryClient()
  const [editableFields, setEditableFields] =
    useState<FormField[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialFields[0]?.fieldId ?? null,
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const initialPayload = useMemo(
    () => buildFormSchemaUpsertPayload(initialFields),
    [initialFields],
  )
  const draftPayload = useMemo(
    () => buildFormSchemaUpsertPayload(editableFields),
    [editableFields],
  )
  const hasUnsavedChanges =
    JSON.stringify(initialPayload) !== JSON.stringify(draftPayload)

  const selectedField =
    editableFields.find((field) => field.fieldId === selectedFieldId) ?? null

  const saveMutation = useMutation<
    FormSchemaUpsertResponse,
    ApiClientError | Error,
    void
  >({
    mutationFn: async () => {
      const response = await upsertFormSchema(session, courseId, draftPayload)
      return response.data
    },
    onMutate: () => {
      setSaveMessage(null)
    },
    onSuccess: (result) => {
      const normalizedFields = draftPayload.fields
      const nextSchema: FormSchema = {
        id: result.formId,
        courseId,
        version: result.version,
        fields: normalizedFields,
      }

      queryClient.setQueryData<FormSchema>(queryKey, nextSchema)
      setSaveMessage(
        `Schema saved as version ${result.version}. The latest draft is now active for new enrollments.`,
      )
    },
  })

  function updateSelectedField(updater: (field: FormField) => FormField) {
    setEditableFields((currentFields) =>
      currentFields.map((field) =>
        field.fieldId === selectedFieldId ? updater(field) : field,
      ),
    )
  }

  function addField() {
    const nextField = createDraftField(editableFields.length)

    setEditableFields((currentFields) =>
      withDisplayOrder([...currentFields, nextField]),
    )
    setSelectedFieldId(nextField.fieldId)
  }

  function moveSelectedField(direction: 'up' | 'down') {
    if (!selectedFieldId) {
      return
    }

    setEditableFields((currentFields) => {
      const index = currentFields.findIndex((field) => field.fieldId === selectedFieldId)
      if (index < 0) {
        return currentFields
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= currentFields.length) {
        return currentFields
      }

      const nextFields = [...currentFields]
      const [selected] = nextFields.splice(index, 1)
      nextFields.splice(targetIndex, 0, selected)
      return withDisplayOrder(nextFields)
    })
  }

  function addOption() {
    updateSelectedField((field) => ({
      ...field,
      options: [
        ...(field.options ?? []),
        {
          value: `option_${(field.options?.length ?? 0) + 1}`,
          label: `Option ${(field.options?.length ?? 0) + 1}`,
        },
      ],
    }))
  }

  function updateOption(
    optionIndex: number,
    key: 'label' | 'value',
    value: string,
  ) {
    updateSelectedField((field) => ({
      ...field,
      options: (field.options ?? []).map((option, index) =>
        index === optionIndex ? { ...option, [key]: value } : option,
      ),
    }))
  }

  function removeOption(optionIndex: number) {
    updateSelectedField((field) => ({
      ...field,
      options: (field.options ?? []).filter((_, index) => index !== optionIndex),
    }))
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
            <button
              className="button button--ghost"
              disabled={!selectedField}
              onClick={() => moveSelectedField('up')}
              type="button"
            >
              Move up
            </button>
            <button
              className="button button--ghost"
              disabled={!selectedField}
              onClick={() => moveSelectedField('down')}
              type="button"
            >
              Move down
            </button>
            <button
              className="button button--secondary"
              disabled={!editableFields.length || !hasUnsavedChanges || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              type="button"
            >
              {saveMutation.isPending ? 'Saving schema...' : 'Save schema'}
            </button>
          </div>
          {hasUnsavedChanges ? (
            <div className="designer-banner designer-banner--warning" role="status">
              <strong>Draft has unsaved changes.</strong>
              <span>Save the schema to publish the next form version for this course.</span>
            </div>
          ) : null}
          {saveMutation.isError ? (
            <div className="designer-banner designer-banner--error" role="alert">
              <strong>{saveMutation.error.message}</strong>
              <span>The latest saved schema is still available. Review the draft and try again.</span>
            </div>
          ) : null}
          {saveMessage ? (
            <div className="designer-banner designer-banner--success" role="status">
              <strong>Schema saved successfully.</strong>
              <span>{saveMessage}</span>
            </div>
          ) : null}
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
              <section className="designer-subpanel">
                <div className="section-heading">
                  <p className="section-heading__eyebrow">Validation</p>
                  <h2>Field rules</h2>
                </div>
                <div className="designer-editor-grid">
                  <label className="session-form__field">
                    <span>Min length</span>
                    <input
                      onChange={(event) =>
                        updateSelectedField((field) => ({
                          ...field,
                          validation: {
                            ...field.validation,
                            minLength: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          },
                        }))
                      }
                      type="number"
                      value={selectedField.validation?.minLength ?? ''}
                    />
                  </label>
                  <label className="session-form__field">
                    <span>Max length</span>
                    <input
                      onChange={(event) =>
                        updateSelectedField((field) => ({
                          ...field,
                          validation: {
                            ...field.validation,
                            maxLength: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          },
                        }))
                      }
                      type="number"
                      value={selectedField.validation?.maxLength ?? ''}
                    />
                  </label>
                  <label className="session-form__field">
                    <span>Min value</span>
                    <input
                      onChange={(event) =>
                        updateSelectedField((field) => ({
                          ...field,
                          validation: {
                            ...field.validation,
                            min: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          },
                        }))
                      }
                      type="number"
                      value={selectedField.validation?.min ?? ''}
                    />
                  </label>
                  <label className="session-form__field">
                    <span>Max value</span>
                    <input
                      onChange={(event) =>
                        updateSelectedField((field) => ({
                          ...field,
                          validation: {
                            ...field.validation,
                            max: event.target.value
                              ? Number(event.target.value)
                              : undefined,
                          },
                        }))
                      }
                      type="number"
                      value={selectedField.validation?.max ?? ''}
                    />
                  </label>
                  <label className="session-form__field">
                    <span>Pattern</span>
                    <input
                      onChange={(event) =>
                        updateSelectedField((field) => ({
                          ...field,
                          validation: {
                            ...field.validation,
                            pattern: event.target.value || undefined,
                          },
                        }))
                      }
                      placeholder="^[A-Za-z]+$"
                      type="text"
                      value={selectedField.validation?.pattern ?? ''}
                    />
                  </label>
                </div>
              </section>

              {selectedField.type === 'single_select' ||
              selectedField.type === 'multi_select' ? (
                <section className="designer-subpanel">
                  <div className="section-heading">
                    <p className="section-heading__eyebrow">Options</p>
                    <h2>Select field choices</h2>
                  </div>
                  <div className="button-row">
                    <button
                      className="button button--secondary"
                      onClick={addOption}
                      type="button"
                    >
                      Add option
                    </button>
                  </div>
                  {(selectedField.options ?? []).length ? (
                    <div className="designer-option-list">
                      {(selectedField.options ?? []).map((option, optionIndex) => (
                        <div key={`${option.value}-${optionIndex}`} className="designer-option-row">
                          <input
                            onChange={(event) =>
                              updateOption(optionIndex, 'label', event.target.value)
                            }
                            placeholder="Label"
                            type="text"
                            value={option.label}
                          />
                          <input
                            onChange={(event) =>
                              updateOption(optionIndex, 'value', event.target.value)
                            }
                            placeholder="Value"
                            type="text"
                            value={option.value}
                          />
                          <button
                            className="button button--ghost"
                            onClick={() => removeOption(optionIndex)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="designer-empty-panel">
                      <h3>No options configured</h3>
                      <p>Add the selectable values for this field.</p>
                    </div>
                  )}
                </section>
              ) : null}
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

      {!schemaQuery.isLoading && !schemaQuery.isError && session ? (
        <FormDesignerEditor
          key={`${schemaQuery.data?.id || 'draft'}-${schemaQuery.data?.version || 0}-${courseId}`}
          courseId={schemaQuery.data?.courseId || courseId}
          formId={schemaQuery.data?.id}
          initialFields={schemaQuery.data?.fields ?? []}
          queryKey={['org-form-schema', session?.tenantId || '', courseId]}
          session={session}
          version={schemaQuery.data?.version}
        />
      ) : null}

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Designer workflow</p>
          <h2>Schema editing is ready for end-to-end MVP use</h2>
        </div>
        <p>
          Load the active template, refine field rules and options, then save to
          create the next form version for this course. A fuller publishing and
          version history experience can land in later phases.
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
