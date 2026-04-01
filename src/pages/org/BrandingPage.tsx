import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { OrgWorkspaceNav } from '../../components/layout/OrgWorkspaceNav'
import { PageHero } from '../../components/layout/PageHero'
import { useOrgSession } from '../../features/org-session/useOrgSession'
import {
  ApiClientError,
  createUploadTicket,
  getAsset,
  updateBranding,
  type BrandingUpdateResponse,
  type OrgAsset,
  type UploadTicketResponse,
} from '../../lib/api'

async function uploadAssetBinary(ticket: UploadTicketResponse, file: File) {
  const response = await fetch(ticket.uploadUrl, {
    method: ticket.method || 'PUT',
    headers: ticket.headers,
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}.`)
  }
}

export function BrandingPage() {
  const { session } = useOrgSession()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedAsset, setUploadedAsset] = useState<OrgAsset | null>(null)
  const [brandingResult, setBrandingResult] =
    useState<BrandingUpdateResponse | null>(null)

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
    string | null
  >({
    mutationFn: async (logoAssetId) => {
      if (!session) {
        throw new Error('Missing org session.')
      }

      const response = await updateBranding(session, {
        logoAssetId,
      })

      return response.data
    },
    onSuccess(result) {
      setBrandingResult(result)
    },
  })

  return (
    <div className="page-stack">
      <PageHero
        badge="Org settings"
        title="Branding and public identity"
        description="Update the tenant logo from the settings workspace without pulling course authoring out of focus."
      />

      <OrgWorkspaceNav
        eyebrow="Settings workspace"
        title="Settings tools stay grouped together"
        items={[
          {
            label: 'Branding',
            description: 'Upload and apply the public logo asset for this tenant.',
            to: '/org/branding',
            state: 'current',
          },
          {
            label: 'Audit',
            description: 'Inspect recent tenant actions and trace identifiers.',
            to: '/org/audit',
          },
          {
            label: 'Back to courses',
            description: 'Return to the course workspace when settings work is done.',
            to: '/org/courses',
          },
        ]}
      />

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
              onClick={() => brandingMutation.mutate(uploadedAsset.id)}
              type="button"
            >
              {brandingMutation.isPending
                ? 'Applying branding...'
                : 'Apply as org logo'}
            </button>
            <button
              className="button button--ghost"
              disabled={brandingMutation.isPending}
              onClick={() => brandingMutation.mutate(null)}
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
              <strong>{brandingResult.tenantId || session?.tenantId}</strong>
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
