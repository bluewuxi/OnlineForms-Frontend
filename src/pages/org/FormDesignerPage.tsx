import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { buildFormSchemaUpsertPayload } from '../../features/form-designer/schemaPayload'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  getLatestFormSchema,
  listFormTemplates,
  type FormField,
  type FormFieldType,
  type FormSchema,
  type FormSchemaUpsertResponse,
  type FormTemplate,
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

const FIELD_ID_REGEX = /^[a-z][a-z0-9_]{1,63}$/

function isValidFieldId(fieldId: string): boolean {
  return FIELD_ID_REGEX.test(fieldId)
}

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

function createInitialEnrollmentFields(): FormField[] {
  return [
    {
      fieldId: 'first_name',
      type: 'short_text',
      label: 'First Name',
      helpText: 'Enter the learner first name as it appears on official records.',
      required: true,
      displayOrder: 1,
      options: [],
      validation: {
        minLength: 1,
        maxLength: 100,
      },
    },
    {
      fieldId: 'last_name',
      type: 'short_text',
      label: 'Last Name',
      helpText: 'Enter the learner family name or surname.',
      required: true,
      displayOrder: 2,
      options: [],
      validation: {
        minLength: 1,
        maxLength: 100,
      },
    },
    {
      fieldId: 'date_of_birth',
      type: 'date',
      label: 'Date of Birth',
      helpText: 'Provide the learner date of birth.',
      required: true,
      displayOrder: 3,
      options: [],
      validation: {},
    },
    {
      fieldId: 'mobile',
      type: 'phone',
      label: 'Mobile',
      helpText: 'Use a mobile number that can receive updates about the enrollment.',
      required: true,
      displayOrder: 4,
      options: [],
      validation: {
        minLength: 8,
        maxLength: 20,
      },
    },
    {
      fieldId: 'email',
      type: 'email',
      label: 'Email',
      helpText: 'Use the primary email address for enrollment confirmations.',
      required: true,
      displayOrder: 5,
      options: [],
      validation: {
        maxLength: 255,
      },
    },
  ]
}

type FormDesignerEditorProps = {
  canWrite: boolean
  courseId: string
  formId?: string
  isNewSchema?: boolean
  version?: number
  initialFields: FormField[]
  queryKey: string[]
  session: OrgSessionHeaders
  availableTemplates?: FormTemplate[]
}

function FormDesignerEditor({
  canWrite,
  courseId,
  formId,
  isNewSchema = false,
  version,
  initialFields,
  queryKey,
  session,
  availableTemplates = [],
}: FormDesignerEditorProps) {
  const queryClient = useQueryClient()
  const [editableFields, setEditableFields] =
    useState<FormField[]>(initialFields)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialFields[0]?.fieldId ?? null,
  )
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [pendingTemplateApply, setPendingTemplateApply] = useState(false)

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
  const hasInvalidFieldIds = editableFields.some((f) => !isValidFieldId(f.fieldId))

  const selectedField =
    editableFields.find((field) => field.fieldId === selectedFieldId) ?? null

  const selectedFieldIdError =
    selectedField && !isValidFieldId(selectedField.fieldId)
      ? 'Must start with a lowercase letter, then lowercase letters, digits, or underscores only (e.g. first_name). Max 64 chars.'
      : null

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

      queryClient.setQueryData(queryKey, {
        schema: nextSchema,
        isNewSchema: false,
      })
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

  function handleFieldIdChange(nextFieldId: string) {
    updateSelectedField((field) => ({
      ...field,
      fieldId: nextFieldId,
    }))
    setSelectedFieldId(nextFieldId)
  }

  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Schema summary</p>
          <h2>Version {version ?? 'Draft'}</h2>
        </div>
        {isNewSchema ? (
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>No form schema exists yet.</strong>
            <span>Add fields and save to create the first enrollment form version for this course.</span>
          </div>
        ) : null}
        <div className="detail-summary-grid">
          <div className="field-card">
            <span>Form ID</span>
            <strong>{formId || 'Not created yet'}</strong>
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
          {!canWrite ? (
            <div className="designer-banner designer-banner--warning" role="status">
              <strong>You have read-only access to this tenant.</strong>
              <span>Contact an Org Admin to make changes.</span>
            </div>
          ) : null}
          {canWrite ? (
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
                disabled={!editableFields.length || !hasUnsavedChanges || hasInvalidFieldIds || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                type="button"
              >
                {saveMutation.isPending ? 'Saving schema...' : 'Save schema'}
              </button>
              {availableTemplates.length > 0 ? (
                <button
                  className="button button--ghost"
                  onClick={() => setPendingTemplateApply((prev) => !prev)}
                  type="button"
                >
                  Apply template
                </button>
              ) : null}
            </div>
          ) : null}
          {canWrite && pendingTemplateApply && availableTemplates.length > 0 ? (
            <div className="designer-banner designer-banner--warning" role="status">
              <strong>Apply a template</strong>
              {editableFields.length > 0 ? (
                <span>This will replace all {editableFields.length} current field{editableFields.length !== 1 ? 's' : ''} with the template fields. Save first if you want to keep a version of the current schema.</span>
              ) : (
                <span>Select a template to pre-populate the field list.</span>
              )}
              <div className="button-row" style={{ marginTop: '0.5rem' }}>
                <select
                  value={selectedTemplateId}
                  onChange={(event) => setSelectedTemplateId(event.target.value)}
                  style={{ flexShrink: 0 }}
                >
                  <option value="">— choose a template —</option>
                  {availableTemplates.map((tpl) => (
                    <option key={tpl.templateId} value={tpl.templateId}>
                      {tpl.name} ({tpl.fields.length} field{tpl.fields.length !== 1 ? 's' : ''})
                    </option>
                  ))}
                </select>
                <button
                  className="button button--primary"
                  disabled={!selectedTemplateId}
                  onClick={() => {
                    const tpl = availableTemplates.find((t) => t.templateId === selectedTemplateId)
                    if (tpl) {
                      const reindexed = withDisplayOrder(tpl.fields)
                      setEditableFields(reindexed)
                      setSelectedFieldId(reindexed[0]?.fieldId ?? null)
                    }
                    setSelectedTemplateId('')
                    setPendingTemplateApply(false)
                  }}
                  type="button"
                >
                  Apply
                </button>
                <button
                  className="button button--ghost"
                  onClick={() => { setSelectedTemplateId(''); setPendingTemplateApply(false) }}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {canWrite && hasUnsavedChanges ? (
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

        {canWrite ? (<section className="content-panel">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Field editor</p>
            <h2>Core field properties</h2>
          </div>
          {selectedField ? (
            <div className="designer-editor-grid">
              <div className="session-form__field">
                <label htmlFor="designer-field-id">Field ID</label>
                <input
                  id="designer-field-id"
                  onChange={(event) => handleFieldIdChange(event.target.value)}
                  type="text"
                  value={selectedField.fieldId}
                  aria-describedby={selectedFieldIdError ? 'designer-field-id-error' : undefined}
                  aria-invalid={selectedFieldIdError ? true : undefined}
                />
                {selectedFieldIdError ? (
                  <span id="designer-field-id-error" className="form-field-error" role="alert">
                    {selectedFieldIdError}
                  </span>
                ) : null}
              </div>
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
        </section>) : null}
      </section>
    </>
  )
}

function createEmptyFormSchema(courseId: string): FormSchema {
  return {
    courseId,
    version: 0,
    fields: createInitialEnrollmentFields(),
  }
}

export function FormDesignerPage() {
  const { session } = useOrgSession()
  const canWrite = useCanWrite()
  const { courseId = '' } = useParams()

  const templatesQuery = useQuery({
    queryKey: ['org-form-templates', session?.tenantId],
    queryFn: async () => {
      if (!session) return []
      const response = await listFormTemplates(session)
      return response.data
    },
    enabled: Boolean(session),
  })

  const schemaQuery = useQuery({
    queryKey: ['org-form-schema', session?.tenantId, courseId],
    queryFn: async () => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      try {
        const response = await getLatestFormSchema(session, courseId)
        return {
          schema: response.data,
          isNewSchema: false,
        }
      } catch (error) {
        if (error instanceof ApiClientError && error.code === 'NOT_FOUND') {
          return {
            schema: createEmptyFormSchema(courseId),
            isNewSchema: true,
          }
        }

        throw error
      }
    },
    enabled: Boolean(session && courseId),
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Form designer"
        title="Course form template"
        description="Stay inside the course workflow while you refine the enrolment schema, save the next version, and return to publish-ready details."
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
          message="The selected course form could not be loaded. Check the org session or retry the request."
        />
      ) : null}

      {!schemaQuery.isLoading && !schemaQuery.isError && session ? (
        <FormDesignerEditor
          key={`${schemaQuery.data?.schema.id || 'draft'}-${schemaQuery.data?.schema.version || 0}-${courseId}`}
          canWrite={canWrite}
          courseId={schemaQuery.data?.schema.courseId || courseId}
          formId={schemaQuery.data?.schema.id}
          initialFields={schemaQuery.data?.schema.fields ?? []}
          isNewSchema={schemaQuery.data?.isNewSchema}
          queryKey={['org-form-schema', session?.tenantId || '', courseId]}
          session={session}
          version={schemaQuery.data?.schema.version}
          availableTemplates={templatesQuery.data ?? []}
        />
      ) : null}

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Designer workflow</p>
          <h2>Schema editing remains part of course setup</h2>
        </div>
        <p>
          Load the active template, refine field rules and options, then save to
          create the next form version for this course before returning to the
          course details page for publishing decisions.
        </p>
        <div className="button-row">
          <Link className="button button--secondary" to={courseId ? `/org/courses/${courseId}` : '/org/courses'}>
            Back to course details
          </Link>
        </div>
      </section>
    </div>
  )
}
