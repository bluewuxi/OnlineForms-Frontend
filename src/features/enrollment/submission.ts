export function normalizeEnrollmentAnswers(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (Array.isArray(value)) {
        return [key, value]
      }

      if (typeof value === 'string') {
        return [key, value.trim()]
      }

      return [key, value]
    }),
  )
}

export function createEnrollmentMeta() {
  return {
    locale: navigator.language || 'en-US',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }
}
