import { describe, expect, it } from 'vitest'
import { buildFormSchemaUpsertPayload } from './schemaPayload'

describe('buildFormSchemaUpsertPayload', () => {
  it('trims values, removes empty options, and resequences display order', () => {
    expect(
      buildFormSchemaUpsertPayload([
        {
          fieldId: ' first_name ',
          type: 'short_text',
          label: ' First name ',
          helpText: ' ',
          required: true,
          displayOrder: 9,
          options: [],
          validation: {
            minLength: 1,
            maxLength: null,
            pattern: '  ',
          },
        },
        {
          fieldId: '  ',
          type: 'single_select',
          label: '  ',
          helpText: ' Pick one ',
          required: false,
          displayOrder: 3,
          options: [
            { label: ' Option A ', value: ' a ' },
            { label: ' ', value: 'ignore-me' },
            { label: 'Option B', value: ' ' },
          ],
          validation: {
            min: 0,
            max: 10,
          },
        },
      ]),
    ).toEqual({
      fields: [
        {
          fieldId: 'first_name',
          type: 'short_text',
          label: 'First name',
          helpText: null,
          required: true,
          displayOrder: 1,
          options: [],
          validation: {
            minLength: 1,
          },
        },
        {
          fieldId: 'field_2',
          type: 'single_select',
          label: 'Untitled field 2',
          helpText: 'Pick one',
          required: false,
          displayOrder: 2,
          options: [{ label: 'Option A', value: 'a' }],
          validation: {
            min: 0,
            max: 10,
          },
        },
      ],
    })
  })
})
