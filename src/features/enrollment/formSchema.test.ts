import { describe, expect, it } from 'vitest'
import { parseFormSchema } from './formSchema'

describe('parseFormSchema', () => {
  it('normalizes backend schema fields into a sorted form schema', () => {
    const schema = parseFormSchema(
      {
        version: 3,
        fields: [
          {
            fieldId: 'email',
            type: 'email',
            label: 'Email',
            displayOrder: 2,
            required: true,
          },
          {
            fieldId: 'first_name',
            type: 'short_text',
            label: 'First name',
            displayOrder: 1,
            required: true,
          },
        ],
      },
      1,
    )

    expect(schema?.version).toBe(3)
    expect(schema?.fields.map((field) => field.fieldId)).toEqual([
      'first_name',
      'email',
    ])
  })
})
