import { apiRequest } from './http'
import type {
  AuditEvent,
  BrandingUpdatePayload,
  BrandingUpdateResponse,
  CursorPage,
  FormField,
  FormSchemaUpsertPayload,
  FormSchemaUpsertResponse,
  OrgAsset,
  OrgSessionHeaders,
  Submission,
  SubmissionStatus,
  SubmissionStatusUpdatePayload,
  UploadTicketRequest,
  UploadTicketResponse,
} from './types'

type BackendPage = {
  limit: number
  nextCursor: string | null
}

type BackendListEnvelope<TItem> = {
  data: TItem[]
  page: BackendPage
}

type BackendItemEnvelope<TItem> = {
  data: TItem
}

type BackendSubmission = {
  id: string
  courseId: string
  formId?: string
  formVersion?: number
  status: SubmissionStatus
  submittedAt: string
  reviewedAt?: string | null
  reviewedBy?: string | null
  createdAt?: string
  tenantCode?: string
  applicant?: Record<string, unknown>
  applicantSummary?: {
    email?: string | null
    name?: string | null
  }
  answers?: Record<string, unknown>
}

type BackendAuditEvent = {
  id: string
  actorUserId?: string
  action: string
  resourceType?: string
  resourceId: string
  requestId?: string
  correlationId?: string
  createdAt: string
}

type BackendFormSchema = {
  formId: string
  courseId: string
  version: number
  fields: FormField[]
}

function mapSubmission(submission: BackendSubmission): Submission {
  return {
    id: submission.id,
    courseId: submission.courseId,
    formId: submission.formId,
    formVersion: submission.formVersion,
    status: submission.status,
    submittedAt: submission.submittedAt,
    reviewedAt: submission.reviewedAt,
    reviewedBy: submission.reviewedBy,
    createdAt: submission.createdAt,
    tenantCode: submission.tenantCode,
    applicant: submission.applicant,
    applicantName: submission.applicantSummary?.name ?? undefined,
    applicantEmail: submission.applicantSummary?.email ?? undefined,
    answers: submission.answers,
  }
}

function mapAuditEvent(event: BackendAuditEvent): AuditEvent {
  return {
    id: event.id,
    actorId: event.actorUserId,
    action: event.action,
    resource: event.resourceId,
    resourceType: event.resourceType,
    occurredAt: event.createdAt,
    requestId: event.requestId,
    correlationId: event.correlationId,
  }
}

function mapFormSchema(schema: BackendFormSchema) {
  return {
    id: schema.formId,
    courseId: schema.courseId,
    version: schema.version,
    fields: schema.fields,
  }
}

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
  return apiRequest<BackendListEnvelope<BackendSubmission>>({
    path: '/org/submissions',
    session,
    query: params,
  }).then((response) => ({
    ...response,
    data: {
      items: response.data.data.map(mapSubmission),
      nextCursor: response.data.page.nextCursor,
    } satisfies CursorPage<Submission>,
  }))
}

export function getSubmission(
  session: OrgSessionHeaders,
  submissionId: string,
) {
  return apiRequest<BackendItemEnvelope<BackendSubmission>>({
    path: `/org/submissions/${submissionId}`,
    session,
  }).then((response) => ({
    ...response,
    data: mapSubmission(response.data.data),
  }))
}

export function updateSubmissionStatus(
  session: OrgSessionHeaders,
  submissionId: string,
  payload: SubmissionStatusUpdatePayload,
) {
  return apiRequest<BackendItemEnvelope<BackendSubmission>>({
    path: `/org/submissions/${submissionId}`,
    method: 'PATCH',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: mapSubmission(response.data.data),
  }))
}

export function listAuditEvents(
  session: OrgSessionHeaders,
  params: AuditListParams = {},
) {
  return apiRequest<BackendListEnvelope<BackendAuditEvent>>({
    path: '/org/audit',
    session,
    query: params,
  }).then((response) => ({
    ...response,
    data: {
      items: response.data.data.map(mapAuditEvent),
      nextCursor: response.data.page.nextCursor,
    } satisfies CursorPage<AuditEvent>,
  }))
}

export function getLatestFormSchema(
  session: OrgSessionHeaders,
  courseId: string,
) {
  return apiRequest<BackendItemEnvelope<BackendFormSchema>>({
    path: `/org/courses/${courseId}/form-schema`,
    session,
  }).then((response) => ({
    ...response,
    data: mapFormSchema(response.data.data),
  }))
}

export function upsertFormSchema(
  session: OrgSessionHeaders,
  courseId: string,
  payload: FormSchemaUpsertPayload,
) {
  return apiRequest<BackendItemEnvelope<FormSchemaUpsertResponse>>({
    path: `/org/courses/${courseId}/form-schema`,
    method: 'PUT',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}

export function createUploadTicket(
  session: OrgSessionHeaders,
  payload: UploadTicketRequest,
) {
  return apiRequest<BackendItemEnvelope<UploadTicketResponse>>({
    path: '/org/assets/upload-ticket',
    method: 'POST',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}

export function getAsset(session: OrgSessionHeaders, assetId: string) {
  return apiRequest<BackendItemEnvelope<OrgAsset>>({
    path: `/org/assets/${assetId}`,
    session,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}

export function updateBranding(
  session: OrgSessionHeaders,
  payload: BrandingUpdatePayload,
) {
  return apiRequest<BackendItemEnvelope<BrandingUpdateResponse>>({
    path: '/org/branding',
    method: 'PATCH',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}
