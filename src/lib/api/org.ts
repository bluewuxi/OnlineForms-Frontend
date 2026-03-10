import { apiRequest } from './http'
import type {
  AuditEvent,
  BrandingUpdatePayload,
  BrandingUpdateResponse,
  CursorPage,
  OrgAsset,
  OrgSessionHeaders,
  Submission,
  SubmissionStatus,
  SubmissionStatusUpdatePayload,
  UploadTicketRequest,
  UploadTicketResponse,
} from './types'

type SubmissionListParams = {
  cursor?: string
  limit?: number
  courseId?: string
  status?: SubmissionStatus
  submittedFrom?: string
  submittedTo?: string
}

type AuditListParams = {
  cursor?: string
  limit?: number
  action?: string
  actorId?: string
  resourceType?: string
}

export function listSubmissions(
  session: OrgSessionHeaders,
  params: SubmissionListParams = {},
) {
  return apiRequest<CursorPage<Submission>>({
    path: '/org/submissions',
    session,
    query: params,
  })
}

export function getSubmission(
  session: OrgSessionHeaders,
  submissionId: string,
) {
  return apiRequest<Submission>({
    path: `/org/submissions/${submissionId}`,
    session,
  })
}

export function updateSubmissionStatus(
  session: OrgSessionHeaders,
  submissionId: string,
  payload: SubmissionStatusUpdatePayload,
) {
  return apiRequest<Submission>({
    path: `/org/submissions/${submissionId}`,
    method: 'PATCH',
    session,
    body: payload,
  })
}

export function listAuditEvents(
  session: OrgSessionHeaders,
  params: AuditListParams = {},
) {
  return apiRequest<CursorPage<AuditEvent>>({
    path: '/org/audit',
    session,
    query: params,
  })
}

export function createUploadTicket(
  session: OrgSessionHeaders,
  payload: UploadTicketRequest,
) {
  return apiRequest<UploadTicketResponse>({
    path: '/org/assets/upload-ticket',
    method: 'POST',
    session,
    body: payload,
  })
}

export function getAsset(session: OrgSessionHeaders, assetId: string) {
  return apiRequest<OrgAsset>({
    path: `/org/assets/${assetId}`,
    session,
  })
}

export function updateBranding(
  session: OrgSessionHeaders,
  payload: BrandingUpdatePayload,
) {
  return apiRequest<BrandingUpdateResponse>({
    path: '/org/branding',
    method: 'PATCH',
    session,
    body: payload,
  })
}
