import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useCanWrite } from '../../features/org-session/useCanWrite'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { ApiClientError, createOrgInvite, listOrgInvites, type OrgInvite, type OrgRole } from '../../lib/api'

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

function inviteStatusTone(status: OrgInvite['status']): 'info' | 'success' | 'muted' {
  if (status === 'pending') return 'info'
  if (status === 'accepted') return 'success'
  return 'muted'
}

function formatInviteDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString()
}

const ROLE_LABELS: Record<OrgRole, string> = {
  org_viewer: 'Org Viewer',
  org_editor: 'Org Editor',
  org_admin: 'Org Admin',
}

export function TeamPage() {
  const { session } = useOrgSession()
  const canWrite = useCanWrite()
  const queryClient = useQueryClient()
  const [inviteForm, setInviteForm] = useState<InviteFormState>({
    email: '',
    role: 'org_editor',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const invitesQuery = useQuery({
    queryKey: ['org-invites', session?.tenantId],
    queryFn: async () => {
      if (!session) return { items: [], nextCursor: null }
      const response = await listOrgInvites(session)
      return response.data
    },
    enabled: Boolean(session),
  })

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('Missing org session.')
      if (!VALID_ROLES.includes(inviteForm.role)) {
        throw new Error('Invalid role selected.')
      }
      const response = await createOrgInvite(session, {
        email: inviteForm.email.trim(),
        role: inviteForm.role,
      })
      return response.data
    },
    onMutate: () => {
      setFormError(null)
      setSuccessMessage(null)
    },
    onSuccess: (invite) => {
      setInviteForm({ email: '', role: 'org_editor' })
      setSuccessMessage(`Invite sent to ${invite.email} as ${ROLE_LABELS[invite.role]}.`)
      void queryClient.invalidateQueries({ queryKey: ['org-invites', session?.tenantId] })
    },
    onError: (error) => {
      setFormError(error instanceof ApiClientError ? error.message : 'Failed to send invite.')
    },
  })

  function handleSubmit(event: React.FormEvent) {
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

  return (
    <div className="page-stack">
      <PageHero
        badge="Org portal"
        title="Team"
        description="Manage team membership and invite new members to access this tenant."
      />

      {canWrite ? (
        <section className="content-panel content-panel--narrow">
          <SectionHeader
            eyebrow="Invite"
            title="Invite a team member"
            description="Sent invites are valid for 7 days. The recipient must register or sign in to accept."
          />
          <form className="session-form" onSubmit={handleSubmit}>
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
                {createInviteMutation.isPending ? 'Sending...' : 'Send invite'}
              </button>
            </div>
            {formError ? (
              <p className="session-form__error">{formError}</p>
            ) : null}
            {successMessage ? (
              <p className="content-panel__body-copy">{successMessage}</p>
            ) : null}
          </form>
        </section>
      ) : (
        <section className="content-panel content-panel--narrow">
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>You have read-only access to this tenant.</strong>
            <span>Contact an Org Admin to make changes.</span>
          </div>
        </section>
      )}

      <section className="content-panel">
        <SectionHeader
          eyebrow="Pending invites"
          title="Sent invites"
          description="Invites waiting for the recipient to accept."
        />

        {invitesQuery.isLoading ? (
          <LoadingState
            title="Loading invites"
            message="Fetching pending invites for this tenant."
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
          invitesQuery.data?.items.length ? (
            <div className="responsive-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Invited</th>
                  </tr>
                </thead>
                <tbody>
                  {invitesQuery.data.items.map((invite) => (
                    <tr key={invite.inviteId}>
                      <td>{invite.email}</td>
                      <td>{ROLE_LABELS[invite.role]}</td>
                      <td>
                        <StatusChip tone={inviteStatusTone(invite.status)}>
                          {invite.status}
                        </StatusChip>
                      </td>
                      <td>{formatInviteDate(invite.invitedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No pending invites"
              message="Invites sent to team members will appear here."
            />
          )
        ) : null}
      </section>
    </div>
  )
}
