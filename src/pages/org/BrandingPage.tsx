import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { HtmlEditorField } from '../../components/forms/HtmlEditorField'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  createUploadTicket,
  getAsset,
  getBranding,
  updateBranding,
  type BrandingSettings,
  type BrandingUpdateResponse,
  type OrgAsset,
  type UploadTicketResponse,
} from '../../lib/api'

async function uploadAssetBinary(ticket: UploadTicketResponse, file: File) {
  let response: Response

  if (ticket.method === 'POST' && ticket.fields) {
    // Presigned POST — S3 requires a multipart/form-data body.
    // All policy fields must come before the file, and the file field must be last.
    const form = new FormData()
    for (const [key, value] of Object.entries(ticket.fields)) {
      form.append(key, value)
    }
    form.append('file', file)
    response = await fetch(ticket.uploadUrl, { method: 'POST', body: form })
  } else {
    // Presigned PUT (legacy path)
    response = await fetch(ticket.uploadUrl, {
      method: 'PUT',
      headers: ticket.headers,
      body: file,
    })
  }

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}.`)
  }
}

export function BrandingPage() {
  const { session } = useOrgSession()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedAsset, setUploadedAsset] = useState<OrgAsset | null>(null)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [descriptionDirty, setDescriptionDirty] = useState(false)
  const [brandingResult, setBrandingResult] =
    useState<BrandingUpdateResponse | null>(null)

  const brandingQuery = useQuery({
    queryKey: ['org-branding', session?.tenantId],
    enabled: Boolean(session),
    queryFn: async () => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const response = await getBranding(session)
      return response.data
    },
  })

  const currentBranding = useMemo<BrandingSettings | null>(() => {
    return brandingResult || brandingQuery.data || null
  }, [brandingQuery.data, brandingResult])

  const effectiveDescriptionDraft = descriptionDirty
    ? descriptionDraft
    : currentBranding?.description || ''

  const uploadMutation = useMutation<
    OrgAsset,
    ApiClientError | Error,
    File
  >({
    mutationFn: async (file) => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const uploadTicketResponse = await createUploadTicket(session, {
        purpose: 'org_logo',
        contentType: file.type || 'application/octet-stream',
        fileName: file.name,
        sizeBytes: file.size,
      })

      await uploadAssetBinary(uploadTicketResponse.data, file)
      const assetResponse = await getAsset(session, uploadTicketResponse.data.assetId)
      return assetResponse.data
    },
    onSuccess(asset) {
      setUploadedAsset(asset)
      setBrandingResult(null)
    },
  })

  const brandingMutation = useMutation<
    BrandingUpdateResponse,
    ApiClientError | Error,
    { logoAssetId?: string | null; description?: string | null }
  >({
    mutationFn: async (payload) => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const response = await updateBranding(session, payload)
      return response.data
    },
    onSuccess(result) {
      setBrandingResult(result)
      setDescriptionDraft(result.description || '')
      setDescriptionDirty(false)
      brandingQuery.refetch()
    },
  })

  if (brandingQuery.isLoading) {
    return (
      <LoadingState
        title="Loading branding settings"
        message="Fetching the tenant logo state and public description content."
      />
    )
  }

  if (brandingQuery.isError) {
    return (
      <ErrorState
        title="Could not load branding settings"
        message="The branding workspace could not load the current tenant profile."
        onRetry={() => void brandingQuery.refetch()}
      />
    )
  }

  return (
    <div className="page-stack">
      <PageHero
        badge="Org settings"
        title="Branding and public identity"
        description="Maintain the tenant logo and the public description shown on the tenant landing page from one settings surface."
      />

      <section className="content-panel">
        <SectionHeader
          eyebrow="Current profile"
          title="Tenant identity currently in use"
          description="Logo and description changes here flow through to the public tenant page."
        />
        <div className="detail-summary-grid">
          <div className="field-card">
            <span>Tenant</span>
            <strong>{currentBranding?.displayName || session?.tenantId || 'Unknown'}</strong>
          </div>
          <div className="field-card">
            <span>Logo asset ID</span>
            <strong>{currentBranding?.logoAssetId || 'None'}</strong>
          </div>
          <div className="field-card">
            <span>Description status</span>
            <strong>{effectiveDescriptionDraft.trim() ? 'Configured' : 'Missing'}</strong>
          </div>
        </div>
        <div className="button-row">
          <StatusChip tone={currentBranding?.logoAssetId ? 'info' : 'warning'}>
            {currentBranding?.logoAssetId ? 'logo ready' : 'logo missing'}
          </StatusChip>
          <StatusChip tone={effectiveDescriptionDraft.trim() ? 'success' : 'warning'}>
            {effectiveDescriptionDraft.trim() ? 'description ready' : 'description needed'}
          </StatusChip>
        </div>
        {currentBranding?.logoUrl ? (
          <div className="branding-preview">
            <span>Current public logo</span>
            <img
              alt={`${currentBranding.displayName || 'Tenant'} current logo`}
              className="tenant-logo"
              src={currentBranding.logoUrl}
            />
          </div>
        ) : null}
      </section>

      <section className="content-panel">
        <SectionHeader
          eyebrow="Public copy"
          title="Tenant description"
          description="This content renders on the public tenant landing page and supports safe HTML authoring with preview."
        />
        <form
          className="session-form"
          onSubmit={(event) => {
            event.preventDefault()
            brandingMutation.mutate({
              description: effectiveDescriptionDraft.trim() || null,
              logoAssetId: currentBranding?.logoAssetId ?? null,
            })
          }}
        >
          <HtmlEditorField
            label="Tenant description"
            value={effectiveDescriptionDraft}
            onChange={(value) => {
              setDescriptionDirty(true)
              setDescriptionDraft(value)
            }}
          />
          <div className="session-form__actions">
            <button
              className="button button--primary"
              disabled={brandingMutation.isPending}
              type="submit"
            >
              {brandingMutation.isPending ? 'Saving description...' : 'Save description'}
            </button>
            {brandingMutation.isError ? (
              <p className="session-form__error">
                Failed to save tenant description.
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <section className="content-panel">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Upload a logo</p>
          <h2>Request a ticket and upload directly to storage</h2>
        </div>
        <div className="branding-grid">
          <label className="session-form__field">
            <span>Logo file</span>
            <input
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                setSelectedFile(event.target.files?.[0] || null)
              }
              type="file"
            />
          </label>
          <div className="branding-grid__actions">
            <button
              className="button button--primary"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => {
                if (selectedFile) {
                  uploadMutation.mutate(selectedFile)
                }
              }}
              type="button"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload logo'}
            </button>
          </div>
        </div>
        <p className="content-panel__body-copy">
          Accepted types: PNG, JPEG, or WebP. Maximum size: 5 MB.
        </p>
      </section>

      {uploadMutation.isPending ? (
        <LoadingState
          title="Uploading asset"
          message="Creating an upload ticket, transferring the file, and refreshing asset metadata."
        />
      ) : null}

      {uploadMutation.isError ? (
        <ErrorState
          title="Logo upload failed"
          message={uploadMutation.error.message}
          retryLabel="Try upload again"
        />
      ) : null}

      {uploadedAsset ? (
        <section className="content-panel">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Uploaded asset</p>
            <h2>Asset metadata</h2>
          </div>
          <div className="detail-summary-grid">
            <div className="field-card">
              <span>Asset ID</span>
              <strong>{uploadedAsset.id}</strong>
            </div>
            <div className="field-card">
              <span>File name</span>
              <strong>{uploadedAsset.fileName || 'Unavailable'}</strong>
            </div>
            <div className="field-card">
              <span>Content type</span>
              <strong>{uploadedAsset.contentType || 'Unavailable'}</strong>
            </div>
          </div>
          {uploadedAsset.publicUrl || uploadedAsset.url ? (
            <div className="branding-preview">
              <span>Preview URL</span>
              <a
                href={uploadedAsset.publicUrl || uploadedAsset.url}
                rel="noreferrer"
                target="_blank"
              >
                {uploadedAsset.publicUrl || uploadedAsset.url}
              </a>
            </div>
          ) : null}
          <div className="button-row">
            <button
              className="button button--primary"
              disabled={brandingMutation.isPending}
              onClick={() =>
                brandingMutation.mutate({
                  logoAssetId: uploadedAsset.id,
                  description: effectiveDescriptionDraft.trim() || null,
                })
              }
              type="button"
            >
              {brandingMutation.isPending
                ? 'Applying branding...'
                : 'Apply logo and save branding'}
            </button>
            <button
              className="button button--ghost"
              disabled={brandingMutation.isPending}
              onClick={() =>
                brandingMutation.mutate({
                  logoAssetId: null,
                  description: effectiveDescriptionDraft.trim() || null,
                })
              }
              type="button"
            >
              Clear logo
            </button>
          </div>
        </section>
      ) : null}

      {brandingMutation.isError ? (
        <ErrorState
          title="Branding update failed"
          message={brandingMutation.error.message}
          retryLabel="Retry branding update"
        />
      ) : null}

      {brandingResult ? (
        <section className="content-panel">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Branding updated</p>
            <h2>Tenant branding profile saved</h2>
          </div>
          <div className="detail-summary-grid">
            <div className="field-card">
              <span>Tenant</span>
              <strong>{brandingResult.displayName || brandingResult.tenantId || session?.tenantId}</strong>
            </div>
            <div className="field-card">
              <span>Logo asset ID</span>
              <strong>{brandingResult.logoAssetId || 'None'}</strong>
            </div>
            <div className="field-card">
              <span>Updated at</span>
              <strong>{brandingResult.updatedAt || 'Unavailable'}</strong>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
