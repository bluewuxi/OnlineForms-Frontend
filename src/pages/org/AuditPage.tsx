import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import { listAuditEvents } from '../../lib/api'

const pageSize = 20

function formatAuditDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function AuditPage() {
  const { session } = useOrgSession()
  const [actionFilter, setActionFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const auditQuery = useQuery({
    queryKey: [
      'org-audit',
      session?.tenantId,
      actionFilter,
      actorFilter,
      resourceTypeFilter,
      cursor,
    ],
    queryFn: async () => {
      if (!session) {
        return { items: [], nextCursor: null }
      }

      const response = await listAuditEvents(session, {
        action: actionFilter || undefined,
        actorId: actorFilter || undefined,
        resourceType: resourceTypeFilter || undefined,
        limit: pageSize,
        cursor,
      })

      return response.data
    },
    enabled: Boolean(session),
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Org audit"
        title="Tenant audit activity"
        description="Operational visibility for actors, actions, resources, and trace identifiers."
      />

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Audit filters</p>
          <h2>Operational query controls</h2>
        </div>
        <form
          className="org-filter-grid"
          onSubmit={(event) => {
            event.preventDefault()
            setCursor(undefined)
          }}
        >
          <label className="session-form__field">
            <span>Action</span>
            <input
              onChange={(event) => setActionFilter(event.target.value)}
              placeholder="submission.updated"
              type="text"
              value={actionFilter}
            />
          </label>
          <label className="session-form__field">
            <span>Actor ID</span>
            <input
              onChange={(event) => setActorFilter(event.target.value)}
              placeholder="usr_..."
              type="text"
              value={actorFilter}
            />
          </label>
          <label className="session-form__field">
            <span>Resource type</span>
            <input
              onChange={(event) => setResourceTypeFilter(event.target.value)}
              placeholder="submission"
              type="text"
              value={resourceTypeFilter}
            />
          </label>
          <div className="org-filter-grid__actions">
            <button className="button button--primary" type="submit">
              Apply filters
            </button>
            <button
              className="button button--ghost"
              onClick={() => {
                setActionFilter('')
                setActorFilter('')
                setResourceTypeFilter('')
                setCursor(undefined)
              }}
              type="button"
            >
              Clear
            </button>
          </div>
        </form>
      </section>

      {auditQuery.isLoading ? (
        <LoadingState
          title="Loading audit activity"
          message="Fetching the tenant event stream for the current operational filters."
        />
      ) : null}

      {auditQuery.isError ? (
        <ErrorState
          title="We could not load the audit feed"
          message="The audit request failed. Check the org session or retry the request."
        />
      ) : null}

      {!auditQuery.isLoading && !auditQuery.isError ? (
        auditQuery.data?.items.length ? (
          <>
            <section className="content-panel">
              <div className="section-heading">
                <p className="section-heading__eyebrow">Audit event list</p>
                <h2>Recent tenant actions</h2>
              </div>
              <div className="responsive-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Time</th>
                      <th scope="col">Actor</th>
                      <th scope="col">Action</th>
                      <th scope="col">Resource</th>
                      <th scope="col">Request ID</th>
                      <th scope="col">Correlation ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditQuery.data.items.map((event) => (
                      <tr key={event.id}>
                        <td>{formatAuditDate(event.occurredAt)}</td>
                        <td>
                          <strong>{event.actorId || 'System'}</strong>
                          <div className="table-subtext">
                            {event.actorType || 'actor type unavailable'}
                          </div>
                        </td>
                        <td>{event.action}</td>
                        <td>
                          <strong>{event.resource}</strong>
                          <div className="table-subtext">
                            {event.resourceType || 'resource type unavailable'}
                          </div>
                        </td>
                        <td>{event.requestId || 'N/A'}</td>
                        <td>{event.correlationId || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="pagination-panel" aria-label="Audit pagination">
              <p>Showing up to {pageSize} audit events for the active filters.</p>
              {auditQuery.data.nextCursor ? (
                <button
                  className="button button--secondary"
                  onClick={() => setCursor(auditQuery.data?.nextCursor || undefined)}
                  type="button"
                >
                  Load more events
                </button>
              ) : (
                <span className="pagination-panel__hint">No more results</span>
              )}
            </section>
          </>
        ) : (
          <EmptyState
            title="No audit events matched those filters"
            message="Try clearing one or more filters or wait for more tenant activity to be recorded."
            actionLabel="Clear filters"
            onAction={() => {
              setActionFilter('')
              setActorFilter('')
              setResourceTypeFilter('')
              setCursor(undefined)
            }}
          />
        )
      ) : null}
    </div>
  )
}
