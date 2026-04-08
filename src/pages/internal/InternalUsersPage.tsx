import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { ListDetailLayout } from '../../components/layout/ListDetailLayout'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { getRoleLabel } from '../../lib/roleLabels'
import {
  activateInternalAccessUser,
  addInternalAccessUserRole,
  createInternalAccessUser,
  deactivateInternalAccessUser,
  getInternalAccessUser,
  listInternalAccessUserActivity,
  listInternalAccessUsers,
  removeInternalAccessUserRole,
  resetInternalAccessUserPassword,
  type InternalAccessUser,
  type InternalUserActivityEvent,
} from '../../lib/api'

type NoticeTone = 'success' | 'warning' | 'danger'

type Notice = {
  tone: NoticeTone
  message: string
}

type WorkspaceMode = 'detail' | 'create'
type MobileMode = 'directory' | 'workspace'

type CreateFormState = {
  email: string
  preferredName: string
  password: string
  temporaryPassword: boolean
  enabled: boolean
}

const emptyCreateForm: CreateFormState = {
  email: '',
  preferredName: '',
  password: '',
  temporaryPassword: false,
  enabled: true,
}

function isLikelyGuid(value: string | null | undefined) {
  if (!value) {
    return false
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

function resolvePreferredName(
  user: Pick<InternalAccessUser, 'email' | 'preferredName' | 'username' | 'userId'>,
) {
  const candidate = (user.preferredName || '').trim()
  if (!candidate || isLikelyGuid(candidate)) {
    return null
  }
  const email = (user.email || '').trim().toLowerCase()
  const username = (user.username || '').trim().toLowerCase()
  const userId = (user.userId || '').trim().toLowerCase()
  if (
    (email && candidate.toLowerCase() === email) ||
    (username && candidate.toLowerCase() === username) ||
    (userId && candidate.toLowerCase() === userId)
  ) {
    return null
  }
  return candidate
}

function resolvePrimaryIdentity(
  user: Pick<InternalAccessUser, 'username' | 'email' | 'userId'>,
) {
  const username = (user.username || '').trim()
  const email = (user.email || '').trim()
  if (email) {
    return email
  }
  if (username && !isLikelyGuid(username)) {
    return username
  }
  return user.userId
}

function formatActivityTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function activityTone(event: InternalUserActivityEvent) {
  if (event.eventType === 'internal_user.deactivated') {
    return 'warning'
  }
  if (event.eventType === 'internal_user.password_reset') {
    return 'info'
  }
  return 'muted'
}

export function InternalUsersPage() {
  const { session } = useOrgSession()
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('detail')
  const [mobileMode, setMobileMode] = useState<MobileMode>('directory')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm)
  const [resetPasswordDraft, setResetPasswordDraft] = useState('TempPassword1')
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const deferredSearch = useDeferredValue(searchInput)
  const resetConfirmButtonRef = useRef<HTMLButtonElement | null>(null)
  const resetTriggerButtonRef = useRef<HTMLButtonElement | null>(null)

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

  const filteredUsers = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    return (usersQuery.data || []).filter((user) => {
      const matchesSearch =
        !query ||
        resolvePrimaryIdentity(user).toLowerCase().includes(query) ||
        (resolvePreferredName(user) || '').toLowerCase().includes(query) ||
        user.userId.toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
            ? user.enabled
            : !user.enabled
      return matchesSearch && matchesStatus
    })
  }, [deferredSearch, statusFilter, usersQuery.data])

  const effectiveSelectedUserId = useMemo(() => {
    if (filteredUsers.length === 0) {
      return ''
    }
    if (selectedUserId && filteredUsers.some((row) => row.userId === selectedUserId)) {
      return selectedUserId
    }
    return filteredUsers[0].userId
  }, [filteredUsers, selectedUserId])

  const selectedListUser =
    filteredUsers.find((row) => row.userId === effectiveSelectedUserId)
    || usersQuery.data?.find((row) => row.userId === effectiveSelectedUserId)
    || null

  const detailQuery = useQuery({
    queryKey: ['internal-user', effectiveSelectedUserId],
    queryFn: async () => {
      if (!session || !effectiveSelectedUserId) {
        throw new Error('Missing user context.')
      }
      const response = await getInternalAccessUser(session, effectiveSelectedUserId)
      return response.data
    },
    enabled: Boolean(session) && workspaceMode === 'detail' && Boolean(effectiveSelectedUserId),
  })

  const activityQuery = useQuery({
    queryKey: ['internal-user-activity', effectiveSelectedUserId],
    queryFn: async () => {
      if (!session || !effectiveSelectedUserId) {
        throw new Error('Missing user activity context.')
      }
      const response = await listInternalAccessUserActivity(session, effectiveSelectedUserId)
      return response.data
    },
    enabled: Boolean(session) && workspaceMode === 'detail' && Boolean(effectiveSelectedUserId),
  })

  const selectedUser = detailQuery.data || selectedListUser
  const selectedPreferredName = selectedUser ? resolvePreferredName(selectedUser) : null
  const selectedWorkspaceUserId = selectedUser?.userId || ''
  const totalUsers = usersQuery.data?.length || 0
  const activeUsers = (usersQuery.data || []).filter((user) => user.enabled).length
  const privilegedUsers = (usersQuery.data || []).filter((user) =>
    user.internalRoles.includes('internal_admin')).length

  function setSuccess(message: string) {
    setNotice({ tone: 'success', message })
  }

  function setFailure(error: unknown, fallback: string) {
    const message = error instanceof Error ? error.message : fallback
    setNotice({ tone: 'danger', message })
  }

  function invalidateSelectedUser(userId: string, includeList = true) {
    if (includeList) {
      void queryClient.invalidateQueries({ queryKey: ['internal-users'] })
    }
    void queryClient.invalidateQueries({ queryKey: ['internal-user', userId] })
    void queryClient.invalidateQueries({ queryKey: ['internal-user-activity', userId] })
  }

  const createUserMutation = useMutation({
    mutationFn: async () => {
      if (!session) {
        throw new Error('Missing session.')
      }
      const response = await createInternalAccessUser(session, {
        email: createForm.email,
        preferredName: createForm.preferredName || null,
        password: createForm.password,
        temporaryPassword: createForm.temporaryPassword,
        internalRoles: ['internal_admin'],
        enabled: createForm.enabled,
      })
      return response.data
    },
    onSuccess: (created) => {
      setWorkspaceMode('detail')
      setMobileMode('workspace')
      setSelectedUserId(created.userId)
      setCreateForm(emptyCreateForm)
      setSuccess('Internal user created.')
      invalidateSelectedUser(created.userId)
    },
    onError: (error) => setFailure(error, 'Failed to create internal user.'),
  })

  const activationMutation = useMutation({
    mutationFn: async (payload: { userId: string; mode: 'activate' | 'deactivate' }) => {
      if (!session || !payload.userId) {
        throw new Error('Missing user context.')
      }
      if (payload.mode === 'activate') {
        const response = await activateInternalAccessUser(session, payload.userId)
        return response.data
      }
      const response = await deactivateInternalAccessUser(session, payload.userId)
      return response.data
    },
    onSuccess: (updated) => {
      setSuccess(updated.enabled ? 'User activated.' : 'User deactivated.')
      invalidateSelectedUser(updated.userId)
    },
    onError: (error) => setFailure(error, 'Failed to update user status.'),
  })

  const roleMutation = useMutation({
    mutationFn: async (payload: { userId: string; mode: 'add' | 'remove' }) => {
      if (!session || !payload.userId) {
        throw new Error('Missing user context.')
      }
      if (payload.mode === 'add') {
        const response = await addInternalAccessUserRole(session, payload.userId, {
          role: 'internal_admin',
        })
        return response.data
      }
      const response = await removeInternalAccessUserRole(session, payload.userId, {
        role: 'internal_admin',
      })
      return response.data
    },
    onSuccess: (updated) => {
      setSuccess(
        updated.internalRoles.includes('internal_admin')
          ? 'Internal admin role added.'
          : 'Internal admin role removed.',
      )
      invalidateSelectedUser(updated.userId)
    },
    onError: (error) => setFailure(error, 'Failed to update internal role.'),
  })

  const passwordResetMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session || !userId) {
        throw new Error('Missing user context.')
      }
      const response = await resetInternalAccessUserPassword(session, userId, {
        password: resetPasswordDraft,
      })
      return response.data
    },
    onSuccess: (result) => {
      setConfirmResetOpen(false)
      setSuccess('Temporary password reset initiated.')
      invalidateSelectedUser(result.userId, false)
    },
    onError: (error) => setFailure(error, 'Failed to reset password.'),
  })

  useEffect(() => {
    if (!confirmResetOpen) {
      return
    }

    resetConfirmButtonRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setConfirmResetOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [confirmResetOpen])

  useEffect(() => {
    if (confirmResetOpen) {
      return
    }
    resetTriggerButtonRef.current?.focus()
  }, [confirmResetOpen])

  useEffect(() => {
    if (!notice) {
      return
    }
    const timer = setTimeout(() => {
      setNotice(null)
    }, 4000)
    return () => clearTimeout(timer)
  }, [notice])

  return (
    <div className="page-stack">
      <PageHero
        badge="Management"
        title="Internal users"
        description="Control internal access, credentials, and activity for platform operators."
      />

      {notice ? (
        <div
          className={`internal-users-notice internal-users-notice--${notice.tone}`}
          role="status"
          aria-live="polite"
        >
          {notice.message}
        </div>
      ) : null}

      {usersQuery.isLoading ? (
        <LoadingState
          title="Loading operator directory"
          message="Preparing the operator directory."
        />
      ) : null}

      {usersQuery.isError ? (
        <ErrorState
          title="Could not load internal users"
          message="Check API availability and internal access configuration."
          onRetry={() => void usersQuery.refetch()}
        />
      ) : null}

      {!usersQuery.isLoading && !usersQuery.isError ? (
        <div
          className={`internal-users-console internal-users-console--${mobileMode}`}
        >
          <ListDetailLayout
            mode="internal"
            list={(
              <section className="content-panel internal-users-directory">
                <SectionHeader
                  eyebrow="Directory"
                  title="Internal operators"
                  description="Search by identity, then open a user to inspect and act quickly."
                  actions={(
                    <button
                      className="button button--primary"
                      onClick={() => {
                        setWorkspaceMode('create')
                        setMobileMode('workspace')
                        setNotice(null)
                      }}
                      type="button"
                    >
                      Add internal user
                    </button>
                  )}
                />

                <div className="internal-users-summary-strip" aria-label="Internal user directory summary">
                  <div className="internal-users-summary-strip__item">
                    <span>Total operators</span>
                    <strong>{totalUsers}</strong>
                  </div>
                  <div className="internal-users-summary-strip__item">
                    <span>Active</span>
                    <strong>{activeUsers}</strong>
                  </div>
                  <div className="internal-users-summary-strip__item">
                    <span>Internal admins</span>
                    <strong>{privilegedUsers}</strong>
                  </div>
                </div>

                <div className="internal-users-directory__filters">
                  <label className="session-form__field">
                    <span>Search users</span>
                    <input
                      type="search"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search email, name, or user ID"
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

                {filteredUsers.length > 0 ? (
                  <ul className="internal-users-directory__items">
                    {filteredUsers.map((user) => {
                      const isActive = workspaceMode === 'detail' && user.userId === effectiveSelectedUserId
                      return (
                        <li key={user.userId}>
                          <button
                            className={isActive
                              ? 'internal-users-directory__item internal-users-directory__item--active'
                              : 'internal-users-directory__item'}
                            onClick={() => {
                              setSelectedUserId(user.userId)
                              setWorkspaceMode('detail')
                              setMobileMode('workspace')
                              setNotice(null)
                            }}
                            type="button"
                          >
                          <div className="internal-users-directory__primary">
                            <strong>{resolvePrimaryIdentity(user)}</strong>
                            <StatusChip tone={user.enabled ? 'success' : 'muted'}>
                              {user.enabled ? 'active' : 'inactive'}
                            </StatusChip>
                          </div>
                          <span>{resolvePreferredName(user) || user.username}</span>
                          <span className="internal-users-directory__subtext">
                            Directory status: {user.status}
                          </span>
                          <div className="internal-users-role-row">
                              {user.internalRoles.map((role) => (
                                <StatusChip key={role} tone="info">
                                  {getRoleLabel(role)}
                                </StatusChip>
                              ))}
                            </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    title={usersQuery.data?.length ? 'No users match those filters' : 'No internal users'}
                    message={usersQuery.data?.length
                      ? 'Try a different search or status filter.'
                      : 'Create the first internal operator to initialise platform management.'}
                  />
                )}
              </section>
            )}
            detail={(
              <section className="content-panel internal-users-workspace">
                <div className="internal-users-workspace__mobile-actions">
                  <button
                    className="button button--ghost"
                    onClick={() => setMobileMode('directory')}
                    type="button"
                  >
                    Back to users
                  </button>
                </div>

                {workspaceMode === 'create' ? (
                  <>
                    <SectionHeader
                      eyebrow="Create"
                      title="Add internal user"
                      description="Set identity, initial access, and password behaviour in one flow."
                    />
                    <form
                      className="session-form"
                      onSubmit={(event) => {
                        event.preventDefault()
                        setNotice(null)
                        createUserMutation.mutate()
                      }}
                    >
                      <label className="session-form__field">
                        <span>Email</span>
                        <input
                          type="email"
                          value={createForm.email}
                          onChange={(event) =>
                            setCreateForm((current) => ({ ...current, email: event.target.value }))}
                        />
                      </label>
                      <label className="session-form__field">
                        <span>Preferred name</span>
                        <input
                          type="text"
                          value={createForm.preferredName}
                          onChange={(event) =>
                            setCreateForm((current) => ({
                              ...current,
                              preferredName: event.target.value,
                            }))}
                        />
                      </label>
                      <label className="session-form__field">
                        <span>Initial password</span>
                        <input
                          type="text"
                          value={createForm.password}
                          onChange={(event) =>
                            setCreateForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))}
                        />
                      </label>
                      <label className="internal-users-checkbox">
                        <input
                          type="checkbox"
                          checked={createForm.temporaryPassword}
                          onChange={(event) =>
                            setCreateForm((current) => ({
                              ...current,
                              temporaryPassword: event.target.checked,
                            }))}
                        />
                        <span>Require password change on first login</span>
                      </label>
                      <label className="internal-users-checkbox">
                        <input
                          type="checkbox"
                          checked={createForm.enabled}
                          onChange={(event) =>
                            setCreateForm((current) => ({
                              ...current,
                              enabled: event.target.checked,
                            }))}
                        />
                        <span>Enable account immediately</span>
                      </label>
                      <div className="internal-users-inline-note">
                        Day-one UI grants the <strong>internal_admin</strong> role only.
                      </div>
                      <div className="session-form__actions">
                        <button className="button button--primary" type="submit">
                          {createUserMutation.isPending ? 'Creating...' : 'Create internal user'}
                        </button>
                        <button
                          className="button button--secondary"
                          onClick={() => {
                            setWorkspaceMode('detail')
                            setMobileMode('directory')
                          }}
                          type="button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </>
                ) : !selectedUser ? (
                  <EmptyState
                    title="Select a user"
                    message="Choose a user from the directory to open the access-control workspace."
                  />
                ) : (
                  <>
                    <SectionHeader
                      eyebrow="Selected user"
                      title={resolvePrimaryIdentity(selectedUser)}
                      description="Review state, internal access, credentials, and recent activity without leaving the workspace."
                    />

                    <section className="internal-users-summary">
                      <div>
                        <p className="internal-users-summary__eyebrow">Identity</p>
                        <h2>{selectedPreferredName || resolvePrimaryIdentity(selectedUser)}</h2>
                        <p>{selectedUser.email || selectedUser.username}</p>
                      </div>
                      <div className="internal-users-summary__meta">
                        <StatusChip tone={selectedUser.enabled ? 'success' : 'muted'}>
                          {selectedUser.enabled ? 'active' : 'inactive'}
                        </StatusChip>
                        {selectedUser.internalRoles.map((role) => (
                          <StatusChip key={role} tone="info">
                            {getRoleLabel(role)}
                          </StatusChip>
                        ))}
                      </div>
                    </section>

                    <section className="internal-users-section">
                      <SectionHeader
                        eyebrow="Access"
                        title="Internal access"
                        description="Immediate lifecycle actions with backend guardrails."
                      />
                      <div className="internal-users-action-row">
                        <button
                          className="button button--primary"
                          onClick={() =>
                            activationMutation.mutate({
                              userId: selectedWorkspaceUserId,
                              mode: selectedUser.enabled ? 'deactivate' : 'activate',
                            })}
                          type="button"
                        >
                          {activationMutation.isPending
                            ? 'Saving...'
                            : selectedUser.enabled
                              ? 'Deactivate user'
                              : 'Activate user'}
                        </button>
                        <button
                          className="button button--secondary"
                          onClick={() =>
                            roleMutation.mutate({
                              userId: selectedWorkspaceUserId,
                              mode: selectedUser.internalRoles.includes('internal_admin') ? 'remove' : 'add',
                            })}
                          type="button"
                        >
                          {roleMutation.isPending
                            ? 'Updating role...'
                            : selectedUser.internalRoles.includes('internal_admin')
                              ? 'Remove internal admin'
                              : 'Add internal admin'}
                        </button>
                      </div>
                    </section>

                    <section className="internal-users-section">
                      <SectionHeader
                        eyebrow="Credentials"
                        title="Password control"
                        description="Reset uses temporary-password semantics and requires the user to change it on next login."
                      />
                      <div className="internal-users-reset-card">
                        <label className="session-form__field">
                          <span>Temporary password</span>
                          <input
                            type="text"
                            value={resetPasswordDraft}
                            onChange={(event) => setResetPasswordDraft(event.target.value)}
                          />
                        </label>
                        <button
                          className="button button--secondary"
                          ref={resetTriggerButtonRef}
                          onClick={() => {
                            setConfirmResetOpen(true)
                            setNotice(null)
                          }}
                          type="button"
                        >
                          Reset password
                        </button>
                      </div>
                    </section>

                    <section className="internal-users-section">
                      <SectionHeader
                        eyebrow="Activity"
                        title="Activity timeline"
                        description="Recent sign-in, access, and credential events for this user."
                      />
                      {activityQuery.isLoading && !activityQuery.data ? (
                        <LoadingState
                          title="Loading activity"
                          message="Preparing recent internal-user events."
                        />
                      ) : activityQuery.data?.sourceStatus === 'unavailable' ? (
                        <ErrorState
                          title="Activity source unavailable"
                          message="User management is still available, but recent activity could not be loaded right now."
                          onRetry={() => void activityQuery.refetch()}
                        />
                      ) : activityQuery.data?.items.length ? (
                        <ol className="internal-users-activity-list">
                          {activityQuery.data.items.map((event) => (
                            <li
                              key={event.id}
                              className="internal-users-activity-list__item"
                              data-event={event.eventType.replace('internal_user.', '')}
                            >
                              <div className="internal-users-activity-list__meta">
                                <StatusChip tone={activityTone(event)}>
                                  {event.eventType.replace('internal_user.', '').replaceAll('_', ' ')}
                                </StatusChip>
                                <span>{formatActivityTime(event.createdAt)}</span>
                              </div>
                              <strong>{event.summary}</strong>
                              {event.actorUserId ? (
                                <span>Actor: {event.actorUserId}</span>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <EmptyState
                          title="No activity yet"
                          message="Activity will appear after sign-in or access changes for this operator."
                        />
                      )}
                    </section>

                    <section className="internal-users-section">
                      <SectionHeader
                        eyebrow="Tenant visibility"
                        title="Tenant access"
                        description="Read only in the internal portal."
                      />
                      {detailQuery.isLoading && !detailQuery.data ? (
                        <LoadingState
                          title="Loading memberships"
                          message="Fetching tenant visibility data."
                        />
                      ) : detailQuery.data?.memberships.length ? (
                        <ul className="internal-users-memberships">
                          {detailQuery.data.memberships.map((membership) => (
                            <li key={membership.tenantId} className="internal-users-memberships__item">
                              <strong>{membership.tenantId}</strong>
                              <span>{membership.status}</span>
                              <span>{membership.roles.map(getRoleLabel).join(', ') || 'No roles'}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyState
                          title="No tenant memberships"
                          message="This user currently has no tenant-specific memberships."
                        />
                      )}
                    </section>
                  </>
                )}
              </section>
            )}
          />
        </div>
      ) : null}

      {confirmResetOpen && selectedUser ? (
        <div className="internal-users-modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-title">
          <div className="internal-users-modal__surface" aria-describedby="reset-password-description">
            <p className="section-heading__eyebrow">Confirm action</p>
            <h2 id="reset-password-title">Reset password for {resolvePrimaryIdentity(selectedUser)}</h2>
            <p id="reset-password-description">
              This will replace the current password with a temporary password and require the user to change it on next login.
            </p>
            <div className="session-form__actions">
              <button
                className="button button--primary"
                ref={resetConfirmButtonRef}
                onClick={() => passwordResetMutation.mutate(selectedWorkspaceUserId)}
                type="button"
              >
                {passwordResetMutation.isPending ? 'Resetting...' : 'Confirm reset'}
              </button>
              <button
                className="button button--secondary"
                onClick={() => setConfirmResetOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
