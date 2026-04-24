import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { HtmlEditorField } from '../../components/forms/HtmlEditorField'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingState } from '../../components/feedback/LoadingState'
import { StatusChip } from '../../components/feedback/StatusChip'
import { PageHero } from '../../components/layout/PageHero'
import { SectionHeader } from '../../components/layout/SectionHeader'
import { useCanWrite } from '../../features/org-session/useCanWrite'
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
  type TenantTheme,
  type UploadTicketResponse,
} from '../../lib/api'

const FONT_OPTIONS = [
  { label: 'Platform default', value: '' },
  { label: 'System UI', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Georgia', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Palatino', value: "'Palatino Linotype', Palatino, serif" },
  { label: 'Courier New', value: "'Courier New', Courier, monospace" },
]

const CUSTOM_FONT_SENTINEL = '__custom__'

const COLOR_SCHEMES = [
  {
    label: 'Platform Default',
    value: 'default',
    colors: { accentColor: '#6c47ff', accentStrongColor: '#5235cc', ctaColor: '#ff6b35', bgColor: '#f8f7ff', textColor: '#1a1a2e' },
  },
  {
    label: 'Ocean',
    value: 'ocean',
    colors: { accentColor: '#0ea5e9', accentStrongColor: '#0369a1', ctaColor: '#f59e0b', bgColor: '#f0f9ff', textColor: '#0f172a' },
  },
  {
    label: 'Forest',
    value: 'forest',
    colors: { accentColor: '#16a34a', accentStrongColor: '#15803d', ctaColor: '#f97316', bgColor: '#f0fdf4', textColor: '#1a2e1a' },
  },
  {
    label: 'Crimson',
    value: 'crimson',
    colors: { accentColor: '#dc2626', accentStrongColor: '#b91c1c', ctaColor: '#2563eb', bgColor: '#fff5f5', textColor: '#1c1414' },
  },
  {
    label: 'Slate',
    value: 'slate',
    colors: { accentColor: '#475569', accentStrongColor: '#334155', ctaColor: '#0ea5e9', bgColor: '#f8fafc', textColor: '#0f172a' },
  },
]

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
  const canWrite = useCanWrite()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedAsset, setUploadedAsset] = useState<OrgAsset | null>(null)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [descriptionDirty, setDescriptionDirty] = useState(false)
  const [themeDraft, setThemeDraft] = useState<TenantTheme>({})
  const [themeDirty, setThemeDirty] = useState(false)
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

  const effectiveTheme = themeDirty ? themeDraft : (currentBranding?.theme ?? {})

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
    { logoAssetId?: string | null; description?: string | null; theme?: TenantTheme }
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
      setThemeDirty(false)
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
        <div className="detail-summary-grid detail-summary-grid--three-col">
          <div className="branding-tenant-row branding-tenant-row--wide">
            {currentBranding?.logoUrl ? (
              <img
                alt={`${currentBranding.displayName || 'Tenant'} logo`}
                className="tenant-logo tenant-logo--inline"
                src={currentBranding.logoUrl}
              />
            ) : null}
            <div className="field-card branding-tenant-info">
              <span>Tenant</span>
              <strong>{currentBranding?.displayName || session?.tenantId || 'Unknown'}</strong>
            </div>
          </div>
          <div className="field-card">
            <span>Description status</span>
            <strong>{effectiveDescriptionDraft.trim() ? 'Configured' : 'Missing'}</strong>
          </div>
        </div>
        <p className="branding-logo-asset-id">
          <span>Logo asset ID</span>
          <strong>{currentBranding?.logoAssetId || 'None'}</strong>
        </p>
        <div className="button-row">
          <StatusChip tone={currentBranding?.logoAssetId ? 'info' : 'warning'}>
            {currentBranding?.logoAssetId ? 'logo ready' : 'logo missing'}
          </StatusChip>
          <StatusChip tone={effectiveDescriptionDraft.trim() ? 'success' : 'warning'}>
            {effectiveDescriptionDraft.trim() ? 'description ready' : 'description needed'}
          </StatusChip>
        </div>
      </section>

      {!canWrite ? (
        <section className="content-panel content-panel--narrow">
          <div className="designer-banner designer-banner--warning" role="status">
            <strong>You have read-only access to this tenant.</strong>
            <span>Contact an Org Admin to make changes.</span>
          </div>
        </section>
      ) : null}

      {canWrite ? (
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
      ) : null}

      {canWrite ? (
        <section className="content-panel">
          <SectionHeader
            eyebrow="Visual theme"
            title="Tenant color scheme and typography"
            description="Override the default platform colors and font for this tenant's public and org portal pages. Leave fields blank to use the platform default."
          />
          <form
            className="session-form"
            onSubmit={(event) => {
              event.preventDefault()
              const themeToSave = { ...themeDraft }
              const pendingFont = themeToSave.fontFamily
              const fontIsCustomOrUntouched =
                pendingFont === undefined ||
                (pendingFont != null && pendingFont !== '' && !FONT_OPTIONS.some(o => o.value === pendingFont))
              if (fontIsCustomOrUntouched) {
                themeToSave.fontFamily = currentBranding?.theme?.fontFamily ?? null
              }
              brandingMutation.mutate({ theme: themeToSave })
            }}
          >
            <label className="session-form__field">
              <span>Colour scheme</span>
              <select
                value=""
                onChange={(e) => {
                  const scheme = COLOR_SCHEMES.find(s => s.value === e.target.value)
                  if (!scheme) return
                  setThemeDirty(true)
                  setThemeDraft((prev) => ({ ...prev, ...scheme.colors }))
                }}
              >
                <option value="">Apply a preset…</option>
                {COLOR_SCHEMES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>

            <div className="detail-summary-grid">
              {(
                [
                  ['accentColor', 'Accent / primary color', '#6c47ff'],
                  ['accentStrongColor', 'Accent strong (hover / active)', '#5235cc'],
                  ['ctaColor', 'Call-to-action button color', '#ff6b35'],
                  ['bgColor', 'Page background color', '#f8f7ff'],
                  ['textColor', 'Body text color', '#1a1a2e'],
                ] as const
              ).map(([field, label, platformDefault]) => (
                <label key={field} className="session-form__field">
                  <span>{label}</span>
                  <div className="theme-color-row">
                    <input
                      type="color"
                      value={effectiveTheme[field] ?? platformDefault}
                      onChange={(e) => {
                        setThemeDirty(true)
                        setThemeDraft((prev) => ({ ...prev, [field]: e.target.value }))
                      }}
                    />
                    <input
                      type="text"
                      placeholder="e.g. #6c47ff — blank to use default"
                      value={effectiveTheme[field] ?? ''}
                      onChange={(e) => {
                        setThemeDirty(true)
                        setThemeDraft((prev) => ({
                          ...prev,
                          [field]: e.target.value.trim() || null,
                        }))
                      }}
                    />
                  </div>
                </label>
              ))}
              <label className="session-form__field">
                <span>Font family</span>
                {(() => {
                  const currentFont = effectiveTheme.fontFamily ?? ''
                  const isCustom = currentFont !== '' && !FONT_OPTIONS.some(o => o.value === currentFont)
                  return (
                    <select
                      value={isCustom ? CUSTOM_FONT_SENTINEL : currentFont}
                      onChange={(e) => {
                        if (e.target.value === CUSTOM_FONT_SENTINEL) return
                        setThemeDirty(true)
                        setThemeDraft((prev) => ({
                          ...prev,
                          fontFamily: e.target.value || null,
                        }))
                      }}
                    >
                      {FONT_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                      {isCustom && (
                        <option value={CUSTOM_FONT_SENTINEL}>Custom value</option>
                      )}
                    </select>
                  )
                })()}
              </label>
            </div>
            <div className="session-form__actions">
              <button
                className="button button--primary"
                disabled={brandingMutation.isPending || !themeDirty}
                type="submit"
              >
                {brandingMutation.isPending ? 'Saving theme...' : 'Save theme'}
              </button>
              <button
                className="button button--ghost"
                type="button"
                disabled={brandingMutation.isPending}
                onClick={() => {
                  setThemeDirty(true)
                  setThemeDraft({
                    accentColor: null,
                    accentStrongColor: null,
                    ctaColor: null,
                    bgColor: null,
                    textColor: null,
                    fontFamily: null,
                  })
                }}
              >
                Reset to platform defaults
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {canWrite ? (
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
      ) : null}

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
                rel="noopener noreferrer"
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
