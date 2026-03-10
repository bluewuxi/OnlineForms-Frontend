import type {
  FormField,
  FormFieldOption,
  FormSchemaUpsertPayload,
  FormFieldValidation,
} from '../../lib/api'

function trimToValue(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeValidation(validation?: FormFieldValidation) {
  if (!validation) {
    return {}
  }

  return Object.fromEntries(
    Object.entries({
      minLength: validation.minLength ?? undefined,
      maxLength: validation.maxLength ?? undefined,
      min: validation.min ?? undefined,
      max: validation.max ?? undefined,
      pattern: trimToValue(validation.pattern),
    }).filter(([, value]) => value !== undefined),
  ) as FormFieldValidation
}

function normalizeOptions(options?: FormFieldOption[]) {
  return (options ?? [])
    .map((option) => ({
      label: option.label.trim(),
      value: option.value.trim(),
    }))
    .filter((option) => option.label && option.value)
}

function normalizeField(field: FormField, index: number): FormField {
  const helpText = trimToValue(field.helpText)
  const options = normalizeOptions(field.options)
  const validation = normalizeValidation(field.validation)

  return {
    fieldId: field.fieldId.trim() || `field_${index + 1}`,
    type: field.type,
    label: field.label.trim() || `Untitled field ${index + 1}`,
    helpText: helpText ?? null,
    required: Boolean(field.required),
    displayOrder: index + 1,
    options,
    validation,
  }
}

export function normalizeFormSchemaFields(fields: FormField[]) {
  return fields.map(normalizeField)
}

export function buildFormSchemaUpsertPayload(
  fields: FormField[],
): FormSchemaUpsertPayload {
  return {
    fields: normalizeFormSchemaFields(fields),
  }
}
