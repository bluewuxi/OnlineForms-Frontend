import { describe, expect, it } from 'vitest'
import { createEnrollmentMeta, normalizeEnrollmentAnswers } from './submission'

describe('enrollment submission helpers', () => {
  it('normalizes trimmed answers', () => {
    expect(
      normalizeEnrollmentAnswers({
        first_name: ' Alice ',
        consent_terms: true,
      }),
    ).toEqual({
      first_name: 'Alice',
      consent_terms: true,
    })
  })

  it('creates locale and timezone metadata', () => {
    const meta = createEnrollmentMeta()

    expect(meta.locale).toBeTruthy()
    expect(meta.timezone).toBeTruthy()
  })
})
