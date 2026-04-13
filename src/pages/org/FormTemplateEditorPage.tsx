import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { buildFormSchemaUpsertPayload } from '../../features/form-designer/schemaPayload'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  createFormTemplate,
  getFormTemplate,
  updateFormTemplate,
  type FormField,
  type FormFieldType,
  type FormTemplate,
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

type TemplateEditorProps = {
  canWrite: boolean
  initialName: string
  initialDescription: string
  initialFields: FormField[]
  isCreateMode: boolean
  templateId: string
  session: NonNullable<ReturnType<typeof useOrgSession>['session']>
}

function TemplateEditor({
  canWrite,
  initialName,
  initialDescription,
  initialFields,
  isCreateMode,
  templateId,
  session,
}: TemplateEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [editableFields, setEditableFields] = useState<FormField[]>(initialFields)
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
    name !== initialName ||
    description !== initialDescription ||
    JSON.stringify(initialPayload) !== JSON.stringify(draftPayload)

  const selectedField =
    editableFields.find((field) => field.fieldId === selectedFieldId) ?? null

  const saveMutation = useMutation<FormTemplate, Error, void>({
    mutationFn: async () => {
      if (isCreateMode) {
        const response = await createFormTemplate(session, {
          name: name.trim(),
          description: description.trim() || null,
          fields: draftPayload.fields,
        })
        return response.data
      } else {
        const response = await updateFormTemplate(session, templateId, {
          name: name.trim(),
          description: description.trim() || null,
          fields: draftPayload.fields,
        })
        return response.data
      }
    },
    onMutate: () => {
      setSaveMessage(null)
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['org-form-template', session.tenantId, result.templateId], result)
      queryClient.invalidateQueries({ queryKey: ['org-form-templates', session.tenantId] })
      setSaveMessage('Template saved successfully.')
      if (isCreateMode) {
        navigate(`/org/form-templates/${result.templateId}`, { replace: true })
      }
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
    setEditableFields((currentFields) => withDisplayOrder([...currentFields, nextField]))
    setSelectedFieldId(nextField.fieldId)
  }

  function moveSelectedField(direction: 'up' | 'down') {
    if (!selectedFieldId) return
    setEditableFields((currentFields) => {
      const index = currentFields.findIndex((field) => field.fieldId === selectedFieldId)
      if (index < 0) return currentFields
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= currentFields.length) return currentFields
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

  function updateOption(optionIndex: number, key: 'label' | 'value', value: string) {
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
    updateSelectedField((field) => ({ ...field, fieldId: nextFieldId }))
    setSelectedFieldId(nextFieldId)
  }

  return (
    <>
      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Template details</p>
          <h2>{isCreateMode ? 'New template' : name || 'Edit template'}</h2>
        </div>
        <div className="designer-editor-grid">
          <label className="session-form__field">
            <span>Template name <span aria-hidden="true">*</span></span>
            <input
              disabled={!canWrite}
              maxLength={120}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Standard enrollment form"
              type="text"
              value={name}
            />
          </label>
          <label className="session-form__field">
            <span>Description</span>
            <textarea
              className="designer-textarea"
              disabled={!canWrite}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe when to use this template."
              rows={2}
              value={description}
            />
          </label>
        </div>
      </section>

      <section className="designer-grid">
        <section className="content-panel">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Field list</p>
            <h2>Template fields</h2>
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
                disabled={
                  !name.trim() ||
                  !editableFields.length ||
                  !hasUnsavedChanges ||
                  saveMutation.isPending
                }
                onClick={() => saveMutation.mutate()}
                type="button"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save template'}
              </button>
            </div>
          ) : null}
          {canWrite && hasUnsavedChanges ? (
            <div className="designer-banner designer-banner--warning" role="status">
              <strong>Unsaved changes.</strong>
              <span>Save to update the template.</span>
            </div>
          ) : null}
          {saveMutation.isError ? (
            <div className="designer-banner designer-banner--error" role="alert">
              <strong>{saveMutation.error.message}</strong>
              <span>Review the template and try again.</span>
            </div>
          ) : null}
          {saveMessage && !hasUnsavedChanges ? (
            <div className="designer-banner designer-banner--success" role="status">
              <strong>{saveMessage}</strong>
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
                    <span>Required: {field.required ? 'Yes' : 'No'}</span>
                    <span>Order: {field.displayOrder ?? 'Not specified'}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="designer-empty-panel">
              <h3>No fields yet</h3>
              <p>Add fields to define the template structure.</p>
            </div>
          )}
        </section>

        {canWrite ? (
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
                    onChange={(event) => handleFieldIdChange(event.target.value)}
                    type="text"
                    value={selectedField.fieldId}
                  />
                </label>
                <label className="session-form__field">
                  <span>Label</span>
                  <input
                    onChange={(event) =>
                      updateSelectedField((field) => ({ ...field, label: event.target.value }))
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
                      updateSelectedField((field) => ({ ...field, helpText: event.target.value }))
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
                      updateSelectedField((field) => ({ ...field, required: event.target.checked }))
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
                              minLength: event.target.value ? Number(event.target.value) : undefined,
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
                              maxLength: event.target.value ? Number(event.target.value) : undefined,
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
                              min: event.target.value ? Number(event.target.value) : undefined,
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
                              max: event.target.value ? Number(event.target.value) : undefined,
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

                {selectedField.type === 'single_select' || selectedField.type === 'multi_select' ? (
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
                          <div
                            key={`${option.value}-${optionIndex}`}
                            className="designer-option-row"
                          >
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
                <p>Choose an existing field or add a new one to start editing its properties.</p>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </>
  )
}

export function FormTemplateEditorPage() {
  const { session } = useOrgSession()
  const canWrite = useCanWrite()
  const { templateId = '' } = useParams()
  const isCreateMode = templateId === 'new'

  const templateQuery = useQuery({
    queryKey: ['org-form-template', session?.tenantId, templateId],
    queryFn: async () => {
      if (!session) throw new Error('Missing session.')
      const response = await getFormTemplate(session, templateId)
      return response.data
    },
    enabled: Boolean(session && !isCreateMode),
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Form templates"
        title={isCreateMode ? 'Create form template' : 'Edit form template'}
        description="Define a reusable set of enrollment fields that can be applied when setting up a new course form."
      />

      {!isCreateMode && templateQuery.isLoading ? (
        <LoadingState title="Loading template" message="Fetching template details." />
      ) : null}

      {!isCreateMode && templateQuery.isError ? (
        <ErrorState
          title="Could not load template"
          message="The template could not be loaded. Check the org session or retry."
        />
      ) : null}

      {session && (isCreateMode || (!templateQuery.isLoading && !templateQuery.isError)) ? (
        <TemplateEditor
          key={templateId}
          canWrite={canWrite}
          initialName={templateQuery.data?.name ?? ''}
          initialDescription={templateQuery.data?.description ?? ''}
          initialFields={templateQuery.data?.fields ?? []}
          isCreateMode={isCreateMode}
          templateId={templateId}
          session={session}
        />
      ) : null}

      <section className="content-panel content-panel--narrow">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Template library</p>
          <h2>Return to all templates</h2>
        </div>
        <div className="button-row">
          <Link className="button button--secondary" to="/org/form-templates">
            Back to templates
          </Link>
        </div>
      </section>
    </div>
  )
}
