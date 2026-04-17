import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useMemo, useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { FormSection } from '../../components/forms/FormSection'
import { HtmlEditorField } from '../../components/forms/HtmlEditorField'
import { ListDetailLayout } from '../../components/layout/ListDetailLayout'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  createInternalTenant,
  getInternalTenant,
  getInternalTenantPaymentSettings,
  listInternalTenants,
  updateInternalTenant,
  updateInternalTenantPaymentSettings,
  type InternalTenantPaymentSettings,
  type InternalTenantProfile,
} from '../../lib/api'

type TenantFormState = {
  displayName: string
  description: string
  homePageContent: string
  isActive: boolean
}

type TenantCreateFormState = TenantFormState & {
  tenantCode: string
}

function toEditFormState(tenant: InternalTenantProfile): TenantFormState {
  return {
    displayName: tenant.displayName,
    description: tenant.description || '',
    homePageContent: tenant.homePageContent || '',
    isActive: tenant.isActive,
  }
}

const emptyCreateState: TenantCreateFormState = {
  tenantCode: '',
  displayName: '',
  description: '',
  homePageContent: '',
  isActive: true,
}

export function InternalTenantsPage() {
  const { session } = useOrgSession()
  const queryClient = useQueryClient()
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [panelMode, setPanelMode] = useState<'edit' | 'create'>('edit')
  const [mobileMode, setMobileMode] = useState<'directory' | 'workspace'>('directory')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [draftsByTenantId, setDraftsByTenantId] = useState<Record<string, TenantFormState>>({})
  const [createDraft, setCreateDraft] = useState<TenantCreateFormState>(emptyCreateState)
  const [saveMessage, setSaveMessage] = useState<string>('')
  const [stripeAccountIdDraft, setStripeAccountIdDraft] = useState('')
  const [applicationFeePercentDraft, setApplicationFeePercentDraft] = useState('')
  const [paymentSettingsDirty, setPaymentSettingsDirty] = useState(false)
  const deferredSearch = useDeferredValue(searchInput)

  const tenantsQuery = useQuery({
    queryKey: ['internal-tenants'],
    queryFn: async () => {
      if (!session) {
        throw new Error('Missing session.')
      }
      const response = await listInternalTenants(session)
      return response.data.items
    },
    enabled: Boolean(session),
  })

  const filteredTenants = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return (tenantsQuery.data || []).filter((tenant) => {
      const matchesSearch =
        !query ||
        tenant.displayName.toLowerCase().includes(query) ||
        tenant.tenantCode.toLowerCase().includes(query) ||
        tenant.tenantId.toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? tenant.isActive
            : !tenant.isActive
      return matchesSearch && matchesStatus
    })
  }, [deferredSearch, statusFilter, tenantsQuery.data])

  const effectiveSelectedTenantId = useMemo(() => {
    const tenants = filteredTenants
    if (tenants.length === 0) {
      return ''
    }
    if (selectedTenantId && tenants.some((row) => row.tenantId === selectedTenantId)) {
      return selectedTenantId
    }
    return tenants[0].tenantId
  }, [filteredTenants, selectedTenantId])

  const detailQuery = useQuery({
    queryKey: ['internal-tenant', effectiveSelectedTenantId],
    queryFn: async () => {
      if (!session || !effectiveSelectedTenantId) {
        throw new Error('Missing tenant context.')
      }
      const response = await getInternalTenant(session, effectiveSelectedTenantId)
      return response.data
    },
    enabled: Boolean(session) && panelMode === 'edit' && Boolean(effectiveSelectedTenantId),
  })

  const selectedTenant = detailQuery.data
    || filteredTenants.find((row) => row.tenantId === effectiveSelectedTenantId)
    || tenantsQuery.data?.find((row) => row.tenantId === effectiveSelectedTenantId)
    || null

  const editFormState = useMemo(
    () =>
      selectedTenant
        ? draftsByTenantId[selectedTenant.tenantId] || toEditFormState(selectedTenant)
        : null,
    [draftsByTenantId, selectedTenant],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session || !selectedTenant || !editFormState) {
        throw new Error('Missing tenant context.')
      }
      const response = await updateInternalTenant(session, selectedTenant.tenantId, {
        displayName: editFormState.displayName,
        description: editFormState.description || null,
        homePageContent: editFormState.homePageContent || null,
        isActive: editFormState.isActive,
      })
      return response.data
    },
    onSuccess: (updated) => {
      setSaveMessage('Tenant profile updated.')
      setDraftsByTenantId((current) => ({
        ...current,
        [updated.tenantId]: toEditFormState(updated),
      }))
      queryClient.invalidateQueries({ queryKey: ['internal-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['internal-tenant', updated.tenantId] })
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('Missing session.')
      }
      const response = await createInternalTenant(session, {
        tenantCode: createDraft.tenantCode,
        displayName: createDraft.displayName,
        description: createDraft.description || null,
        homePageContent: createDraft.homePageContent || null,
        isActive: createDraft.isActive,
      })
      return response.data
    },
    onSuccess: (created) => {
      setPanelMode('edit')
      setMobileMode('workspace')
      setSelectedTenantId(created.tenantId)
      setCreateDraft(emptyCreateState)
      setSaveMessage('Tenant created successfully.')
      queryClient.invalidateQueries({ queryKey: ['internal-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['internal-tenant', created.tenantId] })
    },
  })

  const paymentSettingsQuery = useQuery({
    queryKey: ['internal-tenant-payment-settings', effectiveSelectedTenantId],
    queryFn: async () => {
      if (!session || !effectiveSelectedTenantId) throw new Error('Missing tenant context.')
      const response = await getInternalTenantPaymentSettings(session, effectiveSelectedTenantId)
      return response.data
    },
    enabled: Boolean(session) && panelMode === 'edit' && Boolean(effectiveSelectedTenantId),
  })

  const currentPaymentSettings: InternalTenantPaymentSettings = paymentSettingsQuery.data ?? {}
  const effectiveStripeAccountId = paymentSettingsDirty
    ? stripeAccountIdDraft
    : currentPaymentSettings.stripeAccountId || ''
  const effectiveApplicationFeePercent = paymentSettingsDirty
    ? applicationFeePercentDraft
    : currentPaymentSettings.applicationFeePercent != null
      ? String(currentPaymentSettings.applicationFeePercent)
      : ''

  const paymentSettingsMutation = useMutation<
    InternalTenantPaymentSettings,
    ApiClientError | Error,
    { stripeAccountId: string | null; applicationFeePercent: number | null }
  >({
    mutationFn: async (payload) => {
      if (!session || !effectiveSelectedTenantId) throw new Error('Missing tenant context.')
      const response = await updateInternalTenantPaymentSettings(session, effectiveSelectedTenantId, payload)
      return response.data
    },
    onSuccess: (result) => {
      setStripeAccountIdDraft(result.stripeAccountId || '')
      setApplicationFeePercentDraft(result.applicationFeePercent != null ? String(result.applicationFeePercent) : '')
      setPaymentSettingsDirty(false)
      queryClient.invalidateQueries({ queryKey: ['internal-tenant-payment-settings', effectiveSelectedTenantId] })
    },
  })

  const activeTenantCount = (tenantsQuery.data || []).filter((tenant) => tenant.isActive).length

  return (
    <div className="page-stack">
      <PageHero
        badge="Management"
        title="Tenant management"
        description="Inspect tenant readiness, update branded content, and create new tenant profiles from one internal workspace."
      />

      {tenantsQuery.isLoading ? (
        <LoadingState
          title="Loading tenants"
          message="Fetching tenant profiles for internal management."
        />
      ) : null}

      {tenantsQuery.isError ? (
        <ErrorState
          title="We could not load tenants"
          message="Check credentials and API availability."
          onRetry={() => void tenantsQuery.refetch()}
        />
      ) : null}

      {!tenantsQuery.isLoading && !tenantsQuery.isError ? (
        <div className={`internal-tenants-console internal-tenants-console--${mobileMode}`}>
          <ListDetailLayout
            mode="internal"
            list={(
              <section className="content-panel internal-drawer-list">
                <SectionHeader
                  eyebrow="Tenant directory"
                  title="Tenants"
                  description="Filter the directory, then open a tenant to inspect status and maintain public-facing content."
                  actions={(
                    <button
                      className="button button--primary"
                      onClick={() => {
                        setPanelMode('create')
                        setMobileMode('workspace')
                        setSaveMessage('')
                      }}
                      type="button"
                    >
                      Create tenant
                    </button>
                  )}
                />
                <div className="internal-tenant-summary-strip" aria-label="Tenant directory summary">
                  <div className="internal-tenant-summary-strip__item">
                    <span>Total tenants</span>
                    <strong>{tenantsQuery.data?.length || 0}</strong>
                  </div>
                  <div className="internal-tenant-summary-strip__item">
                    <span>Active tenants</span>
                    <strong>{activeTenantCount}</strong>
                  </div>
                </div>
                <div className="internal-drawer-list__filters">
                  <label className="session-form__field">
                    <span>Search tenants</span>
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search display name, code, or tenant ID"
                    />
                  </label>
                  <label className="session-form__field">
                    <span>Status</span>
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>
                {filteredTenants.length > 0 ? (
                  <ul className="internal-drawer-list__items">
                    {filteredTenants.map((tenant) => {
                      const isActive = panelMode === 'edit' && effectiveSelectedTenantId === tenant.tenantId
                      return (
                        <li key={tenant.tenantId}>
                          <button
                            className={isActive
                              ? 'internal-drawer-list__item internal-drawer-list__item--active'
                              : 'internal-drawer-list__item'}
                            onClick={() => {
                              setPanelMode('edit')
                              setMobileMode('workspace')
                              setSelectedTenantId(tenant.tenantId)
                              setSaveMessage('')
                              setPaymentSettingsDirty(false)
                              setStripeAccountIdDraft('')
                              setApplicationFeePercentDraft('')
                            }}
                            type="button"
                          >
                            <div className="internal-drawer-list__item-header">
                              <strong>{tenant.displayName}</strong>
                              <StatusChip tone={tenant.isActive ? 'success' : 'muted'}>
                                {tenant.isActive ? 'active' : 'inactive'}
                              </StatusChip>
                            </div>
                            <span>{tenant.tenantCode}</span>
                            <span className="internal-drawer-list__item-meta">
                              {tenant.description ? 'Description ready' : 'Description missing'}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    title={tenantsQuery.data?.length ? 'No tenants match those filters' : 'No tenants available'}
                    message={tenantsQuery.data?.length
                      ? 'Try a different search or status filter.'
                      : 'Create the first tenant profile to start onboarding tenants.'}
                  />
                )}
              </section>
            )}
            detail={(
              <section className="content-panel internal-drawer-panel">
                <div className="internal-tenants-workspace__mobile-actions">
                  <button
                    className="button button--ghost"
                    onClick={() => setMobileMode('directory')}
                    type="button"
                  >
                    Back to tenants
                  </button>
                </div>
                {panelMode === 'create' ? (
                  <>
                    <SectionHeader
                      eyebrow="Create"
                      title="New tenant"
                      description="Set up the tenant identity first, then add the public HTML content that powers the tenant landing page."
                    />
                    <form
                      className="session-form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        setSaveMessage('')
                        createMutation.mutate()
                      }}
                    >
                      <FormSection
                        eyebrow="Identity"
                        title="Core profile"
                        description="Capture the tenant code and display name first so the directory and public portal have the right tenant identity."
                      >
                        <label className="session-form__field">
                          <span>Tenant Code</span>
                          <input
                            type="text"
                            value={createDraft.tenantCode}
                            onChange={(event) =>
                              setCreateDraft((current) => ({
                                ...current,
                                tenantCode: event.target.value,
                              }))}
                          />
                        </label>
                        <label className="session-form__field">
                          <span>Display Name</span>
                          <input
                            type="text"
                            value={createDraft.displayName}
                            onChange={(event) =>
                              setCreateDraft((current) => ({
                                ...current,
                                displayName: event.target.value,
                              }))}
                          />
                        </label>
                      </FormSection>
                      <FormSection
                        eyebrow="Content"
                        title="Public-facing copy"
                        description="These fields feed the tenant-facing pages and support HTML content with a safe preview."
                      >
                        <HtmlEditorField
                          label="Description"
                          value={createDraft.description}
                          onChange={(value) =>
                            setCreateDraft((current) => ({
                              ...current,
                              description: value,
                            }))}
                        />
                        <HtmlEditorField
                          label="Tenant Home Content"
                          value={createDraft.homePageContent}
                          onChange={(value) =>
                            setCreateDraft((current) => ({
                              ...current,
                              homePageContent: value,
                            }))}
                        />
                        <label className="session-form__field">
                          <span>Active</span>
                          <select
                            value={createDraft.isActive ? 'true' : 'false'}
                            onChange={(event) =>
                              setCreateDraft((current) => ({
                                ...current,
                                isActive: event.target.value === 'true',
                              }))}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </label>
                      </FormSection>
                      <div className="session-form__actions">
                        <button className="button button--primary" type="submit">
                          {createMutation.isPending ? 'Creating...' : 'Create tenant'}
                        </button>
                      <button
                        className="button button--secondary"
                        onClick={() => {
                          setPanelMode('edit')
                          setMobileMode('directory')
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                        {createMutation.isError ? (
                          <p className="session-form__error">
                            Failed to create tenant profile.
                          </p>
                        ) : null}
                      </div>
                    </form>
                  </>
                ) : selectedTenant ? (
                  <>
                    <SectionHeader
                      eyebrow="Tenant"
                      title="Edit tenant"
                      description="Review tenant status and maintain tenant-authored content without leaving the directory."
                    />
                    <section className="internal-tenant-detail-summary">
                      <div>
                        <p className="internal-tenant-detail-summary__eyebrow">Tenant code</p>
                        <h2>{selectedTenant.displayName}</h2>
                        <p>{selectedTenant.tenantCode}</p>
                      </div>
                      <div className="internal-tenant-detail-summary__meta">
                        <StatusChip tone={selectedTenant.isActive ? 'success' : 'muted'}>
                          {selectedTenant.isActive ? 'active' : 'inactive'}
                        </StatusChip>
                        <StatusChip tone={selectedTenant.description ? 'info' : 'warning'}>
                          {selectedTenant.description ? 'description ready' : 'description needed'}
                        </StatusChip>
                      </div>
                    </section>
                    {detailQuery.isLoading ? (
                      <LoadingState
                        title="Loading tenant details"
                        message="Fetching full tenant profile."
                      />
                    ) : null}
                    {detailQuery.isError ? (
                      <ErrorState
                        title="Could not load tenant details"
                        message="Select a tenant again or retry shortly."
                        onRetry={() => void detailQuery.refetch()}
                      />
                    ) : null}
                    {editFormState ? (
                      <form
                        className="session-form"
                        onSubmit={(event) => {
                          event.preventDefault()
                          setSaveMessage('')
                          saveMutation.mutate()
                        }}
                      >
                        <FormSection
                          eyebrow="Profile"
                          title="Tenant content"
                          description="Keep the public summary and homepage copy accurate. Both fields accept HTML and can be previewed safely."
                        >
                          <label className="session-form__field">
                            <span>Display Name</span>
                            <input
                              type="text"
                              value={editFormState.displayName}
                              onChange={(event) =>
                                setDraftsByTenantId((current) => ({
                                  ...current,
                                  [selectedTenant.tenantId]: {
                                    ...editFormState,
                                    displayName: event.target.value,
                                  },
                                }))}
                            />
                          </label>
                          <HtmlEditorField
                            label="Description"
                            value={editFormState.description}
                            onChange={(value) =>
                              setDraftsByTenantId((current) => ({
                                ...current,
                                [selectedTenant.tenantId]: {
                                  ...editFormState,
                                  description: value,
                                },
                              }))}
                          />
                          <HtmlEditorField
                            label="Tenant Home Content"
                            value={editFormState.homePageContent}
                            onChange={(value) =>
                              setDraftsByTenantId((current) => ({
                                ...current,
                                [selectedTenant.tenantId]: {
                                  ...editFormState,
                                  homePageContent: value,
                                },
                              }))}
                          />
                          <label className="session-form__field">
                            <span>Active</span>
                            <select
                              value={editFormState.isActive ? 'true' : 'false'}
                              onChange={(event) =>
                                setDraftsByTenantId((current) => ({
                                  ...current,
                                  [selectedTenant.tenantId]: {
                                    ...editFormState,
                                    isActive: event.target.value === 'true',
                                  },
                                }))}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </label>
                        </FormSection>
                        <div className="session-form__actions">
                          <button className="button button--primary" type="submit">
                            {saveMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          {saveMessage ? <p>{saveMessage}</p> : null}
                          {saveMutation.isError ? (
                            <p className="session-form__error">
                              Failed to save tenant profile.
                            </p>
                          ) : null}
                        </div>
                      </form>
                      <form
                        className="session-form"
                        onSubmit={(event) => {
                          event.preventDefault()
                          const feeRaw = effectiveApplicationFeePercent.trim()
                          const feeNum = feeRaw === '' ? null : Number(feeRaw)
                          paymentSettingsMutation.mutate({
                            stripeAccountId: effectiveStripeAccountId.trim() || null,
                            applicationFeePercent: feeNum,
                          })
                        }}
                      >
                        <FormSection
                          eyebrow="Stripe Connect"
                          title="Payment settings"
                          description="Configure the connected Stripe account and platform application fee for this tenant. Only internal users can modify these."
                        >
                          <label className="session-form__field">
                            <span>Stripe Account ID</span>
                            <input
                              type="text"
                              value={effectiveStripeAccountId}
                              onChange={(e) => {
                                setPaymentSettingsDirty(true)
                                setStripeAccountIdDraft(e.target.value)
                              }}
                              placeholder="acct_1ABC..."
                            />
                          </label>
                          <label className="session-form__field">
                            <span>Application fee (%)</span>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.01}
                              value={effectiveApplicationFeePercent}
                              onChange={(e) => {
                                setPaymentSettingsDirty(true)
                                setApplicationFeePercentDraft(e.target.value)
                              }}
                              placeholder="e.g. 10"
                            />
                          </label>
                          {currentPaymentSettings.currency ? (
                            <p className="session-form__hint">
                              Currency: <strong>{currentPaymentSettings.currency.toUpperCase()}</strong>
                              {' '}(set by org admin in payment settings)
                            </p>
                          ) : (
                            <p className="session-form__hint">
                              Currency not yet configured by org admin.
                            </p>
                          )}
                        </FormSection>
                        <div className="session-form__actions">
                          <button
                            className="button button--primary"
                            disabled={paymentSettingsMutation.isPending}
                            type="submit"
                          >
                            {paymentSettingsMutation.isPending ? 'Saving...' : 'Save payment settings'}
                          </button>
                          {paymentSettingsMutation.isError ? (
                            <p className="session-form__error">Failed to save payment settings.</p>
                          ) : null}
                        </div>
                      </form>
                    ) : null}
                  </>
                ) : (
                  <EmptyState
                    title="Select a tenant"
                    message="Choose a tenant from the list to open details in the drawer."
                  />
                )}
              </section>
            )}
          />
        </div>
      ) : null}
    </div>
  )
}
