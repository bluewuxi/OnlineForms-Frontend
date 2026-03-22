import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  createInternalAccessUser,
  getInternalAccessUser,
  listInternalAccessUsers,
  removeInternalAccessUser,
} from '../../lib/api'

export function InternalUsersPage() {
  const { session } = useOrgSession()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [panelMode, setPanelMode] = useState<'detail' | 'create'>('detail')
  const [emailInput, setEmailInput] = useState('')
  const [flashMessage, setFlashMessage] = useState('')

  const usersQuery = useQuery({
    queryKey: ['internal-users'],
    queryFn: async () => {
      if (!session) {
        throw new Error('Missing session.')
      }
      const response = await listInternalAccessUsers(session)
      return response.data.items
    },
    enabled: Boolean(session),
  })

  const effectiveSelectedUserId = useMemo(() => {
    const users = usersQuery.data || []
    if (users.length === 0) {
      return ''
    }
    if (selectedUserId && users.some((row) => row.userId === selectedUserId)) {
      return selectedUserId
    }
    return users[0].userId
  }, [selectedUserId, usersQuery.data])

  const detailQuery = useQuery({
    queryKey: ['internal-user', effectiveSelectedUserId],
    queryFn: async () => {
      if (!session || !effectiveSelectedUserId) {
        throw new Error('Missing user context.')
      }
      const response = await getInternalAccessUser(session, effectiveSelectedUserId)
      return response.data
    },
    enabled: Boolean(session) && panelMode === 'detail' && Boolean(effectiveSelectedUserId),
  })

  const addUserMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('Missing session.')
      }
      const response = await createInternalAccessUser(session, { email: emailInput })
      return response.data
    },
    onSuccess: (created) => {
      setPanelMode('detail')
      setSelectedUserId(created.userId)
      setEmailInput('')
      setFlashMessage('Internal access granted.')
      queryClient.invalidateQueries({ queryKey: ['internal-users'] })
      queryClient.invalidateQueries({ queryKey: ['internal-user', created.userId] })
    },
  })

  const removeUserMutation = useMutation({
    mutationFn: async () => {
      if (!session || !effectiveSelectedUserId) {
        throw new Error('Missing user context.')
      }
      const response = await removeInternalAccessUser(session, effectiveSelectedUserId)
      return response.data
    },
    onSuccess: () => {
      setFlashMessage('Internal access removed.')
      setSelectedUserId('')
      queryClient.invalidateQueries({ queryKey: ['internal-users'] })
    },
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Management"
        title="Internal users"
        description="Select a user to inspect internal-access memberships, or add access by email."
      />

      {usersQuery.isLoading ? (
        <LoadingState
          title="Loading users"
          message="Fetching users with internal portal access."
        />
      ) : null}

      {usersQuery.isError ? (
        <ErrorState
          title="Could not load internal users"
          message="Check internal access configuration and API availability."
        />
      ) : null}

      {!usersQuery.isLoading && !usersQuery.isError ? (
        <div className="internal-drawer-layout">
          <section className="content-panel internal-drawer-list">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Access Directory</p>
              <h2>Internal users</h2>
            </div>
            <button
              className="button button--primary"
              onClick={() => {
                setPanelMode('create')
                setFlashMessage('')
              }}
              type="button"
            >
              Add user by email
            </button>
            {usersQuery.data && usersQuery.data.length > 0 ? (
              <ul className="internal-drawer-list__items">
                {usersQuery.data.map((user) => {
                  const isActive = panelMode === 'detail' && user.userId === effectiveSelectedUserId
                  return (
                    <li key={user.userId}>
                      <button
                        className={isActive
                          ? 'internal-drawer-list__item internal-drawer-list__item--active'
                          : 'internal-drawer-list__item'}
                        onClick={() => {
                          setPanelMode('detail')
                          setSelectedUserId(user.userId)
                          setFlashMessage('')
                        }}
                        type="button"
                      >
                        <strong>{user.username}</strong>
                        <span>{user.email || 'no-email'}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <EmptyState
                title="No internal users"
                message="Add the first internal-access user to initialize internal operations."
              />
            )}
          </section>

          <section className="content-panel internal-drawer-panel">
            {panelMode === 'create' ? (
              <>
                <div className="section-heading">
                  <p className="section-heading__eyebrow">Grant Access</p>
                  <h2>Add internal user</h2>
                </div>
                <form
                  className="session-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    setFlashMessage('')
                    addUserMutation.mutate()
                  }}
                >
                  <label className="session-form__field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(event) => setEmailInput(event.target.value)}
                    />
                  </label>
                  <div className="session-form__actions">
                    <button className="button button--primary" type="submit">
                      {addUserMutation.isPending ? 'Adding...' : 'Add user'}
                    </button>
                    <button
                      className="button button--secondary"
                      onClick={() => setPanelMode('detail')}
                      type="button"
                    >
                      Cancel
                    </button>
                    {addUserMutation.isError ? (
                      <p className="session-form__error">
                        Failed to add user. Verify the email exists in Cognito.
                      </p>
                    ) : null}
                  </div>
                </form>
              </>
            ) : detailQuery.isLoading ? (
              <LoadingState
                title="Loading user details"
                message="Fetching memberships and role mappings."
              />
            ) : detailQuery.isError ? (
              <ErrorState
                title="Could not load user details"
                message="Select a user again or retry shortly."
              />
            ) : detailQuery.data ? (
              <>
                <div className="section-heading">
                  <p className="section-heading__eyebrow">User detail</p>
                  <h2>{detailQuery.data.username}</h2>
                </div>
                <p>
                  <strong>Email:</strong> {detailQuery.data.email || 'no-email'}
                </p>
                <p>
                  <strong>Status:</strong> {detailQuery.data.status} ({detailQuery.data.enabled ? 'enabled' : 'disabled'})
                </p>

                <div className="section-heading">
                  <p className="section-heading__eyebrow">Memberships</p>
                  <h2>Tenant access</h2>
                </div>
                {detailQuery.data.memberships.length > 0 ? (
                  <ul className="internal-drawer-list__items">
                    {detailQuery.data.memberships.map((membership) => (
                      <li className="internal-drawer-list__item" key={membership.tenantId}>
                        <strong>{membership.tenantId}</strong>
                        <span>{membership.status}</span>
                        <span>{membership.roles.join(', ') || 'No roles'}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState
                    title="No tenant memberships"
                    message="This user currently has no tenant-specific memberships."
                  />
                )}

                <div className="session-form__actions">
                  <button
                    className="button button--secondary"
                    onClick={() => removeUserMutation.mutate()}
                    type="button"
                  >
                    {removeUserMutation.isPending ? 'Removing...' : 'Remove internal access'}
                  </button>
                  {removeUserMutation.isError ? (
                    <p className="session-form__error">
                      Failed to remove internal access.
                    </p>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                title="Select a user"
                message="Choose a user from the list to view detail and memberships."
              />
            )}
            {flashMessage ? <p>{flashMessage}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  )
}
