import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
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

function toFormState(tenant: InternalTenantProfile): TenantFormState {
  return {
    displayName: tenant.displayName,
    description: tenant.description || '',
    homePageContent: tenant.homePageContent || '',
    isActive: tenant.isActive,
  }
}

export function InternalTenantsPage() {
  const { session } = useOrgSession()
  const queryClient = useQueryClient()
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [draftsByTenantId, setDraftsByTenantId] = useState<Record<string, TenantFormState>>({})
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
    const hasSelection = tenants.some((item) => item.tenantId === selectedTenantId)
    return hasSelection ? selectedTenantId : tenants[0].tenantId
  }, [tenantsQuery.data, selectedTenantId])

  const selectedTenant = useMemo(
    () =>
      tenantsQuery.data?.find((item) => item.tenantId === effectiveSelectedTenantId) || null,
    [tenantsQuery.data, effectiveSelectedTenantId],
  )

  const formState = useMemo(
    () =>
      selectedTenant
        ? draftsByTenantId[selectedTenant.tenantId] || toFormState(selectedTenant)
        : null,
    [draftsByTenantId, selectedTenant],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!session || !selectedTenant || !formState) {
        throw new Error('Missing tenant context.')
      }
      const response = await updateInternalTenant(session, selectedTenant.tenantId, {
        displayName: formState.displayName,
        description: formState.description || null,
        homePageContent: formState.homePageContent || null,
        isActive: formState.isActive,
      })
      return response.data
    },
    onSuccess: () => {
      setSaveMessage('Tenant profile updated.')
      if (selectedTenant && formState) {
        setDraftsByTenantId((current) => ({
          ...current,
          [selectedTenant.tenantId]: formState,
        }))
      }
      queryClient.invalidateQueries({ queryKey: ['internal-tenants'] })
    },
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Management"
        title="Tenant management"
        description="Update tenant profile information. Create and delete are not available in this tool."
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
        tenantsQuery.data && tenantsQuery.data.length > 0 ? (
          <section className="content-panel content-panel--narrow">
            <label className="session-form__field">
              <span>Tenant</span>
              <select
                value={effectiveSelectedTenantId}
                onChange={(event) => {
                  setSelectedTenantId(event.target.value)
                  setSaveMessage('')
                }}
              >
                {tenantsQuery.data.map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.displayName} ({tenant.tenantCode})
                  </option>
                ))}
              </select>
            </label>

            {formState ? (
              <form
                className="session-form"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSaveMessage('')
                  saveMutation.mutate()
                }}
              >
                <label className="session-form__field">
                  <span>Display Name</span>
                  <input
                    type="text"
                    value={formState.displayName}
                    onChange={(event) =>
                      setDraftsByTenantId((current) => {
                        if (!selectedTenant) {
                          return current
                        }
                        return {
                          ...current,
                          [selectedTenant.tenantId]: {
                            ...formState,
                            displayName: event.target.value,
                          },
                        }
                      })
                    }
                  />
                </label>
                <label className="session-form__field">
                  <span>Description</span>
                  <textarea
                    value={formState.description}
                    onChange={(event) =>
                      setDraftsByTenantId((current) => {
                        if (!selectedTenant) {
                          return current
                        }
                        return {
                          ...current,
                          [selectedTenant.tenantId]: {
                            ...formState,
                            description: event.target.value,
                          },
                        }
                      })
                    }
                  />
                </label>
                <label className="session-form__field">
                  <span>Tenant Home Content</span>
                  <textarea
                    value={formState.homePageContent}
                    onChange={(event) =>
                      setDraftsByTenantId((current) => {
                        if (!selectedTenant) {
                          return current
                        }
                        return {
                          ...current,
                          [selectedTenant.tenantId]: {
                            ...formState,
                            homePageContent: event.target.value,
                          },
                        }
                      })
                    }
                  />
                </label>
                <label className="session-form__field">
                  <span>Active</span>
                  <select
                    value={formState.isActive ? 'true' : 'false'}
                    onChange={(event) =>
                      setDraftsByTenantId((current) => {
                        if (!selectedTenant) {
                          return current
                        }
                        return {
                          ...current,
                          [selectedTenant.tenantId]: {
                            ...formState,
                            isActive: event.target.value === 'true',
                          },
                        }
                      })
                    }
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
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
          </section>
        ) : (
          <EmptyState
            title="No tenants available"
            message="No tenant profile records are available to edit."
          />
        )
      ) : null}
    </div>
  )
}
