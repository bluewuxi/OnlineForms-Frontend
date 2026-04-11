import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  createOrgInvite,
  listOrgInvites,
  listOrgMembers,
  removeOrgMember,
  revokeOrgInvite,
  type OrgInvite,
  type OrgMember,
  type OrgRole,
} from '../../lib/api'

type InviteFormState = {
  email: string
  role: OrgRole
}

const ROLE_OPTIONS: Array<{ value: OrgRole; label: string; description: string }> = [
  {
    value: 'org_viewer',
    label: 'Org Viewer',
    description: 'Read-only; can browse courses, submissions, and audit history.',
  },
  {
    value: 'org_editor',
    label: 'Org Editor',
    description: 'Can create and edit courses, form schemas, and assets.',
  },
  {
    value: 'org_admin',
    label: 'Org Admin',
    description: 'Full control; can manage settings, submissions, and team members.',
  },
]

const VALID_ROLES: OrgRole[] = ['org_viewer', 'org_editor', 'org_admin']

const ROLE_LABELS: Record<OrgRole, string> = {
  org_viewer: 'Org Viewer',
  org_editor: 'Org Editor',
  org_admin: 'Org Admin',
}

function memberStatusTone(status: OrgMember['status']): 'success' | 'info' | 'muted' {
  if (status === 'active') return 'success'
  if (status === 'invited') return 'info'
  return 'muted'
}

function inviteStatusTone(status: OrgInvite['status']): 'info' | 'success' {
  return status === 'pending' ? 'info' : 'success'
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

function buildInviteLink(inviteId: string, tenantId: string) {
  return `${window.location.origin}/org/accept-invite?inviteId=${encodeURIComponent(inviteId)}&tenantId=${encodeURIComponent(tenantId)}`
}

export function TeamPage() {
  const { session } = useOrgSession()
  const canWrite = useCanWrite()
  const isAdmin = session?.role === 'org_admin'
  const queryClient = useQueryClient()

  const [inviteForm, setInviteForm] = useState<InviteFormState>({ email: '', role: 'org_editor' })
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [lastCreatedInvite, setLastCreatedInvite] = useState<OrgInvite | null>(null)

  const [pendingRemoveUserId, setPendingRemoveUserId] = useState<string | null>(null)
  const [pendingRevokeInviteId, setPendingRevokeInviteId] = useState<string | null>(null)
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: ['org-members', session?.tenantId],
    queryFn: async () => {
      if (!session) return []
      const response = await listOrgMembers(session)
      return response.data
    },
    enabled: Boolean(session),
  })

  const invitesQuery = useQuery({
    queryKey: ['org-invites', session?.tenantId],
    queryFn: async () => {
      if (!session) return []
      const response = await listOrgInvites(session)
      return response.data
    },
    enabled: Boolean(session),
  })

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Missing org session.')
      if (!VALID_ROLES.includes(inviteForm.role)) throw new Error('Invalid role selected.')
      const response = await createOrgInvite(session, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      })
      return response.data
    },
    onMutate: () => {
      setFormError(null)
      setSuccessMessage(null)
      setLastCreatedInvite(null)
    },
    onSuccess: (invite) => {
      setInviteForm({ email: '', role: 'org_editor' })
      setSuccessMessage(`Invite created for ${invite.email} as ${ROLE_LABELS[invite.role]}.`)
      setLastCreatedInvite(invite)
      void queryClient.invalidateQueries({ queryKey: ['org-invites', session?.tenantId] })
    },
    onError: (error) => {
      setFormError(error instanceof ApiClientError ? error.message : 'Failed to send invite.')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!session) throw new Error('Missing org session.')
      await removeOrgMember(session, userId)
      return userId
    },
    onSuccess: () => {
      setPendingRemoveUserId(null)
      void queryClient.invalidateQueries({ queryKey: ['org-members', session?.tenantId] })
    },
  })

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      if (!session) throw new Error('Missing org session.')
      await revokeOrgInvite(session, inviteId)
      return inviteId
    },
    onSuccess: () => {
      setPendingRevokeInviteId(null)
      void queryClient.invalidateQueries({ queryKey: ['org-invites', session?.tenantId] })
    },
  })

  const copyInviteLink = useCallback((invite: OrgInvite) => {
    const link = buildInviteLink(invite.inviteId, session?.tenantId ?? '')
    void navigator.clipboard.writeText(link).then(() => {
      setCopiedInviteId(invite.inviteId)
      setTimeout(() => setCopiedInviteId((prev) => (prev === invite.inviteId ? null : prev)), 2000)
    })
  }, [session?.tenantId])

  function handleInviteSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!inviteForm.email.trim()) {
      setFormError('Email is required.')
      return
    }
    if (!VALID_ROLES.includes(inviteForm.role)) {
      setFormError('Select a valid role.')
      return
    }
    createInviteMutation.mutate()
  }

  const allInvites = invitesQuery.data ?? []

  return (
    <div className="page-stack">
      <PageHero
        badge="Org portal"
        title="Users"
        description="View and manage who has access to this tenant portal."
      />

      {!canWrite ? (
        <section className="content-panel content-panel--narrow">
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>You have read-only access to this tenant.</strong>
            <span>Contact an Org Admin to make changes.</span>
          </div>
        </section>
      ) : null}

      {/* Active members */}
      <section className="content-panel">
        <SectionHeader
          eyebrow="Members"
          title="Active users"
          description="People with access to this tenant portal and their assigned roles."
        />

        {membersQuery.isLoading ? (
          <LoadingState title="Loading members" message="Fetching team members for this tenant." />
        ) : null}

        {membersQuery.isError ? (
          <ErrorState
            title="Could not load members"
            message="The members request failed. Check the org session or retry."
            onRetry={() => void membersQuery.refetch()}
          />
        ) : null}

        {!membersQuery.isLoading && !membersQuery.isError ? (
          membersQuery.data?.length ? (
            <div className="responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col">User ID</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined</th>
                    {isAdmin ? <th scope="col" aria-label="Actions" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {membersQuery.data.map((member) => {
                    const isPendingRemove = pendingRemoveUserId === member.userId
                    return (
                      <tr key={member.userId}>
                        <td>{member.email ?? '—'}</td>
                        <td>{member.userId}</td>
                        <td>{ROLE_LABELS[member.role]}</td>
                        <td>
                          <StatusChip tone={memberStatusTone(member.status)}>
                            {member.status}
                          </StatusChip>
                        </td>
                        <td>{formatDate(member.activatedAt)}</td>
                        {isAdmin ? (
                          <td className="data-table__actions">
                            {isPendingRemove ? (
                              <span className="data-table__confirm-row">
                                <span>Remove this user?</span>
                                <button
                                  className="button button--danger button--small"
                                  type="button"
                                  disabled={removeMemberMutation.isPending}
                                  onClick={() => removeMemberMutation.mutate(member.userId)}
                                >
                                  {removeMemberMutation.isPending ? 'Removing…' : 'Confirm'}
                                </button>
                                <button
                                  className="button button--ghost button--small"
                                  type="button"
                                  onClick={() => setPendingRemoveUserId(null)}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                className="button button--ghost button--small"
                                type="button"
                                onClick={() => setPendingRemoveUserId(member.userId)}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No members yet"
              message="Team members who accept their invites will appear here."
            />
          )
        ) : null}
      </section>

      {/* Invite form */}
      {canWrite ? (
        <section className="content-panel content-panel--narrow">
          <SectionHeader
            eyebrow="Invite"
            title="Invite a team member"
            description="Sent invites are valid for 7 days. The recipient must register or sign in to accept."
          />
          <form className="session-form" onSubmit={handleInviteSubmit}>
            <label className="session-form__field">
              <span>Email address</span>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(event) => {
                  setFormError(null)
                  setInviteForm((current) => ({ ...current, email: event.target.value }))
                }}
                placeholder="member@example.com"
                autoComplete="off"
              />
            </label>
            <label className="session-form__field">
              <span>Role</span>
              <select
                value={inviteForm.role}
                onChange={(event) => {
                  setFormError(null)
                  setInviteForm((current) => ({ ...current, role: event.target.value as OrgRole }))
                }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {ROLE_OPTIONS.find((o) => o.value === inviteForm.role) ? (
              <p className="content-panel__body-copy">
                {ROLE_OPTIONS.find((o) => o.value === inviteForm.role)!.description}
              </p>
            ) : null}
            <div className="session-form__actions">
              <button
                className="button button--primary"
                type="submit"
                disabled={createInviteMutation.isPending}
              >
                {createInviteMutation.isPending ? 'Sending…' : 'Send invite'}
              </button>
            </div>
            {formError ? <p className="session-form__error">{formError}</p> : null}
            {successMessage && lastCreatedInvite ? (
              <div className="session-form__success">
                <p className="content-panel__body-copy">{successMessage}</p>
                <div className="invite-link-row">
                  <code className="invite-link-row__url">
                    {buildInviteLink(lastCreatedInvite.inviteId, session?.tenantId ?? '')}
                  </code>
                  <button
                    className="button button--ghost button--small"
                    type="button"
                    onClick={() => copyInviteLink(lastCreatedInvite)}
                  >
                    {copiedInviteId === lastCreatedInvite.inviteId ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        </section>
      ) : null}

      {/* Sent invites */}
      <section className="content-panel">
        <SectionHeader
          eyebrow="Invites"
          title="Sent invites"
          description="All invites sent to team members, including pending and accepted."
        />

        {invitesQuery.isLoading ? (
          <LoadingState
            title="Loading invites"
            message="Fetching invites for this tenant."
          />
        ) : null}

        {invitesQuery.isError ? (
          <ErrorState
            title="Could not load invites"
            message="The invites request failed. Check the org session or retry."
            onRetry={() => void invitesQuery.refetch()}
          />
        ) : null}

        {!invitesQuery.isLoading && !invitesQuery.isError ? (
          allInvites.length ? (
            <div className="responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Invited</th>
                    <th scope="col" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {allInvites.map((invite) => {
                    const isPendingRevoke = pendingRevokeInviteId === invite.inviteId
                    return (
                      <tr key={invite.inviteId}>
                        <td>{invite.email}</td>
                        <td>{ROLE_LABELS[invite.role]}</td>
                        <td>
                          <StatusChip tone={inviteStatusTone(invite.status)}>
                            {invite.status}
                          </StatusChip>
                        </td>
                        <td>{formatDate(invite.createdAt)}</td>
                        <td className="data-table__actions">
                          {invite.status === 'pending' ? (
                            isPendingRevoke ? (
                              <span className="data-table__confirm-row">
                                <span>Revoke this invite?</span>
                                <button
                                  className="button button--danger button--small"
                                  type="button"
                                  disabled={revokeInviteMutation.isPending}
                                  onClick={() => revokeInviteMutation.mutate(invite.inviteId)}
                                >
                                  {revokeInviteMutation.isPending ? 'Revoking…' : 'Confirm'}
                                </button>
                                <button
                                  className="button button--ghost button--small"
                                  type="button"
                                  onClick={() => setPendingRevokeInviteId(null)}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <span className="data-table__actions">
                                <button
                                  className="button button--ghost button--small"
                                  type="button"
                                  onClick={() => copyInviteLink(invite)}
                                >
                                  {copiedInviteId === invite.inviteId ? 'Copied!' : 'Copy link'}
                                </button>
                                {isAdmin ? (
                                  <button
                                    className="button button--ghost button--small"
                                    type="button"
                                    onClick={() => setPendingRevokeInviteId(invite.inviteId)}
                                  >
                                    Revoke
                                  </button>
                                ) : null}
                              </span>
                            )
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No invites sent"
              message="Invites sent to team members will appear here."
            />
          )
        ) : null}
      </section>
    </div>
  )
}
