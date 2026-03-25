import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { FormSection } from '../../components/forms/FormSection'
import { ListDetailLayout } from '../../components/layout/ListDetailLayout'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  createInternalTenant,
  getInternalTenant,
  listInternalTenants,
  updateInternalTenant,
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
  const [draftsByTenantId, setDraftsByTenantId] = useState<Record<string, TenantFormState>>({})
  const [createDraft, setCreateDraft] = useState<TenantCreateFormState>(emptyCreateState)
  const [saveMessage, setSaveMessage] = useState<string>('')

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

  const effectiveSelectedTenantId = useMemo(() => {
    const tenants = tenantsQuery.data || []
    if (tenants.length === 0) {
      return ''
    }
    if (selectedTenantId && tenants.some((row) => row.tenantId === selectedTenantId)) {
      return selectedTenantId
    }
    return tenants[0].tenantId
  }, [selectedTenantId, tenantsQuery.data])

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
      setSelectedTenantId(created.tenantId)
      setCreateDraft(emptyCreateState)
      setSaveMessage('Tenant created successfully.')
      queryClient.invalidateQueries({ queryKey: ['internal-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['internal-tenant', created.tenantId] })
    },
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Management"
        title="Tenant management"
        description="Select a tenant from the list to open the right-side drawer, or create a new tenant profile."
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
        />
      ) : null}

      {!tenantsQuery.isLoading && !tenantsQuery.isError ? (
        <ListDetailLayout
          mode="internal"
          list={
            <section className="content-panel internal-drawer-list">
              <SectionHeader
                eyebrow="Tenant directory"
                title="Tenants"
                description="Select a tenant to keep list context while editing details in the adjacent drawer."
                actions={
                  <button
                    className="button button--primary"
                    onClick={() => {
                      setPanelMode('create')
                      setSaveMessage('')
                    }}
                    type="button"
                  >
                    Create tenant
                  </button>
                }
              />
              {tenantsQuery.data && tenantsQuery.data.length > 0 ? (
                <ul className="internal-drawer-list__items">
                  {tenantsQuery.data.map((tenant) => {
                    const isActive = panelMode === 'edit' && effectiveSelectedTenantId === tenant.tenantId
                    return (
                      <li key={tenant.tenantId}>
                        <button
                          className={isActive
                            ? 'internal-drawer-list__item internal-drawer-list__item--active'
                            : 'internal-drawer-list__item'}
                          onClick={() => {
                            setPanelMode('edit')
                            setSelectedTenantId(tenant.tenantId)
                            setSaveMessage('')
                          }}
                          type="button"
                        >
                          <strong>{tenant.displayName}</strong>
                          <span>{tenant.tenantCode}</span>
                          <StatusChip tone={tenant.isActive ? 'success' : 'muted'}>
                            {tenant.isActive ? 'active' : 'inactive'}
                          </StatusChip>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <EmptyState
                  title="No tenants available"
                  message="Create the first tenant profile to start onboarding tenants."
                />
              )}
            </section>
          }
          detail={
            <section className="content-panel internal-drawer-panel">
            {panelMode === 'create' ? (
              <>
                <SectionHeader
                  eyebrow="Create"
                  title="New tenant"
                  description="Use the shared form sections to add a tenant profile without leaving the drawer workflow."
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
                    description="Capture the tenant code and display name first, then add descriptive content."
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
                          }))
                        }
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
                          }))
                        }
                      />
                    </label>
                  </FormSection>
                  <FormSection
                    eyebrow="Content"
                    title="Public-facing copy"
                    description="These fields feed the tenant-facing pages and should stay concise and useful."
                  >
                    <label className="session-form__field">
                      <span>Description</span>
                      <textarea
                        value={createDraft.description}
                        onChange={(event) =>
                          setCreateDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="session-form__field">
                      <span>Tenant Home Content</span>
                      <textarea
                        value={createDraft.homePageContent}
                        onChange={(event) =>
                          setCreateDraft((current) => ({
                            ...current,
                            homePageContent: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className="session-form__field">
                      <span>Active</span>
                      <select
                        value={createDraft.isActive ? 'true' : 'false'}
                        onChange={(event) =>
                          setCreateDraft((current) => ({
                            ...current,
                            isActive: event.target.value === 'true',
                          }))
                        }
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
                      onClick={() => setPanelMode('edit')}
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
                  description="Review the selected tenant in place, then update profile content without leaving the list."
                />
                <p>
                  <strong>Tenant Code:</strong> {selectedTenant.tenantCode}
                </p>
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
                      description="The shared form-section pattern keeps administrative editing grouped and easier to scan."
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
                            }))
                          }
                        />
                      </label>
                      <label className="session-form__field">
                        <span>Description</span>
                        <textarea
                          value={editFormState.description}
                          onChange={(event) =>
                            setDraftsByTenantId((current) => ({
                              ...current,
                              [selectedTenant.tenantId]: {
                                ...editFormState,
                                description: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
                      <label className="session-form__field">
                        <span>Tenant Home Content</span>
                        <textarea
                          value={editFormState.homePageContent}
                          onChange={(event) =>
                            setDraftsByTenantId((current) => ({
                              ...current,
                              [selectedTenant.tenantId]: {
                                ...editFormState,
                                homePageContent: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>
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
                            }))
                          }
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
                ) : null}
              </>
            ) : (
              <EmptyState
                title="Select a tenant"
                message="Choose a tenant from the list to open details in the drawer."
              />
            )}
            </section>
          }
        />
      ) : null}
    </div>
  )
}
