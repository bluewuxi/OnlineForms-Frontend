import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  getPaymentSettings,
  updatePaymentSettings,
  type PaymentSettings,
} from '../../lib/api'

export function PaymentSettingsPage() {
  const { session } = useOrgSession()
  const canWrite = useCanWrite()

  const [currencyDraft, setCurrencyDraft] = useState('')
  const [currencyDirty, setCurrencyDirty] = useState(false)
  const [businessNameDraft, setBusinessNameDraft] = useState('')
  const [businessNameDirty, setBusinessNameDirty] = useState(false)

  const settingsQuery = useQuery({
    queryKey: ['org-payment-settings', session?.tenantId],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) throw new Error('Missing org session.')
      const response = await getPaymentSettings(session)
      return response.data
    },
  })

  const currentSettings: PaymentSettings = settingsQuery.data ?? {}

  const effectiveCurrency = currencyDirty
    ? currencyDraft
    : currentSettings.currency || ''

  const effectiveBusinessName = businessNameDirty
    ? businessNameDraft
    : currentSettings.invoiceBusinessName || ''

  const currencyMutation = useMutation<
    PaymentSettings,
    ApiClientError | Error,
    { currency: string | null }
  >({
    mutationFn: async (payload) => {
      if (!session) throw new Error('Missing org session.')
      const response = await updatePaymentSettings(session, payload)
      return response.data
    },
    onSuccess(result) {
      setCurrencyDraft(result.currency || '')
      setCurrencyDirty(false)
      settingsQuery.refetch()
    },
  })

  const businessNameMutation = useMutation<
    PaymentSettings,
    ApiClientError | Error,
    { invoiceBusinessName: string | null }
  >({
    mutationFn: async (payload) => {
      if (!session) throw new Error('Missing org session.')
      const response = await updatePaymentSettings(session, payload)
      return response.data
    },
    onSuccess(result) {
      setBusinessNameDraft(result.invoiceBusinessName || '')
      setBusinessNameDirty(false)
      settingsQuery.refetch()
    },
  })

  if (settingsQuery.isLoading) {
    return (
      <LoadingState
        title="Loading payment settings"
        message="Fetching the current payment configuration."
      />
    )
  }

  if (settingsQuery.isError) {
    return (
      <ErrorState
        title="Could not load payment settings"
        message="The payment settings page could not load the current configuration."
        onRetry={() => void settingsQuery.refetch()}
      />
    )
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Settings"
        title="Payment settings"
        description="Configure currency and invoicing details used for paid course enrollments."
      />

      {!canWrite ? (
        <section className="content-panel content-panel--narrow">
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>You have read-only access to this tenant.</strong>
            <span>Contact an Org Admin to make changes.</span>
          </div>
        </section>
      ) : null}

      <section className="content-panel">
        <SectionHeader
          eyebrow="Currency"
          title="Payment currency"
          description="Set the currency used for paid course enrollments. Leave blank to disable paid enrollments."
        />
        {canWrite ? (
          <form
            className="session-form"
            onSubmit={(event) => {
              event.preventDefault()
              currencyMutation.mutate({
                currency: effectiveCurrency.trim().toLowerCase() || null,
              })
            }}
          >
            <label className="session-form__field">
              <span>Currency code</span>
              <select
                value={effectiveCurrency.toUpperCase()}
                onChange={(e) => {
                  setCurrencyDirty(true)
                  setCurrencyDraft(e.target.value.toLowerCase())
                }}
              >
                <option value="">Not set (free courses only)</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="NZD">NZD — New Zealand Dollar</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="SGD">SGD — Singapore Dollar</option>
              </select>
            </label>
            <div className="session-form__actions">
              <button
                className="button button--primary"
                disabled={currencyMutation.isPending}
                type="submit"
              >
                {currencyMutation.isPending ? 'Saving...' : 'Save currency'}
              </button>
              {currencyMutation.isError ? (
                <p className="session-form__error">Failed to save currency setting.</p>
              ) : null}
            </div>
          </form>
        ) : (
          <p>{effectiveCurrency.toUpperCase() || 'Not set'}</p>
        )}
      </section>

      <section className="content-panel">
        <SectionHeader
          eyebrow="Invoicing"
          title="Business name for invoicing"
          description="This name appears on payment receipts and invoices sent to enrollees."
        />
        {canWrite ? (
          <form
            className="session-form"
            onSubmit={(event) => {
              event.preventDefault()
              businessNameMutation.mutate({
                invoiceBusinessName: effectiveBusinessName.trim() || null,
              })
            }}
          >
            <label className="session-form__field">
              <span>Business name</span>
              <input
                type="text"
                value={effectiveBusinessName}
                onChange={(e) => {
                  setBusinessNameDirty(true)
                  setBusinessNameDraft(e.target.value)
                }}
                placeholder="e.g. Acme Training Pty Ltd"
              />
            </label>
            <div className="session-form__actions">
              <button
                className="button button--primary"
                disabled={businessNameMutation.isPending}
                type="submit"
              >
                {businessNameMutation.isPending ? 'Saving...' : 'Save business name'}
              </button>
              {businessNameMutation.isError ? (
                <p className="session-form__error">Failed to save business name.</p>
              ) : null}
            </div>
          </form>
        ) : (
          <p>{effectiveBusinessName || 'Not set'}</p>
        )}
      </section>
    </div>
  )
}
