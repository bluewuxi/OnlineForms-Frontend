import type { FormField, FormFieldOption, FormSchema } from '../../lib/api'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asOptions(value: unknown): FormFieldOption[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!isRecord(entry) || typeof entry.value !== 'string') {
        return null
      }

      return {
        value: entry.value,
        label:
          typeof entry.label === 'string' && entry.label.length > 0
            ? entry.label
            : entry.value,
      }
    })
    .filter((entry): entry is FormFieldOption => entry !== null)
}

function asField(value: unknown): FormField | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    typeof value.fieldId !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.label !== 'string'
  ) {
    return null
  }

  return {
    fieldId: value.fieldId,
    type: value.type as FormField['type'],
    label: value.label,
    helpText: typeof value.helpText === 'string' ? value.helpText : null,
    required: Boolean(value.required),
    displayOrder:
      typeof value.displayOrder === 'number' ? value.displayOrder : undefined,
    options: asOptions(value.options),
    validation: isRecord(value.validation)
      ? {
          minLength:
            typeof value.validation.minLength === 'number'
              ? value.validation.minLength
              : undefined,
          maxLength:
            typeof value.validation.maxLength === 'number'
              ? value.validation.maxLength
              : undefined,
          pattern:
            typeof value.validation.pattern === 'string'
              ? value.validation.pattern
              : undefined,
          min:
            typeof value.validation.min === 'number'
              ? value.validation.min
              : undefined,
          max:
            typeof value.validation.max === 'number'
              ? value.validation.max
              : undefined,
        }
      : undefined,
  }
}

export function parseFormSchema(rawSchema: unknown, fallbackVersion?: number | null) {
  if (!isRecord(rawSchema) || !Array.isArray(rawSchema.fields)) {
    return null
  }

  const fields = rawSchema.fields
    .map((field) => asField(field))
    .filter((field): field is FormField => field !== null)
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0))

  const version =
    typeof rawSchema.version === 'number'
      ? rawSchema.version
      : typeof fallbackVersion === 'number'
        ? fallbackVersion
        : 1

  const schema: FormSchema = {
    id: typeof rawSchema.id === 'string' ? rawSchema.id : undefined,
    courseId: typeof rawSchema.courseId === 'string' ? rawSchema.courseId : undefined,
    version,
    fields,
  }

  return schema
}
