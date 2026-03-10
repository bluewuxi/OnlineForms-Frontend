export type QueryPrimitive = string | number | boolean
export type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined

export type ApiErrorEnvelope = {
  error: {
    code: string
    message: string
    details?: unknown
  }
  requestId?: string
  correlationId?: string
}

export type ApiResult<TData> = {
  data: TData
  requestId?: string
  correlationId: string
}

export type OrgSessionHeaders = {
  userId: string
  tenantId: string
  role: string
}

export type ApiRequestOptions = {
  path: string
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  session?: OrgSessionHeaders
  query?: Record<string, QueryValue>
  body?: unknown
  correlationId?: string
  headers?: HeadersInit
}

export type CursorPage<TItem> = {
  items: TItem[]
  nextCursor?: string | null
}

export type CourseListItem = {
  id: string
  title: string
  summary?: string
  deliveryMode?: string
  durationLabel?: string
  enrollmentStatus?: string
}

export type Course = CourseListItem & {
  description?: string
  enrollmentOpensAt?: string | null
  enrollmentClosesAt?: string | null
  formSchema?: Record<string, unknown>
}

export type EnrollmentPayload = {
  applicant: Record<string, unknown>
  answers: Record<string, unknown>
}

export type EnrollmentResponse = {
  submissionId: string
  status: string
}

export type SubmissionStatus = 'pending' | 'reviewed' | 'canceled'

export type Submission = {
  id: string
  courseId: string
  courseTitle?: string
  status: SubmissionStatus
  submittedAt: string
  applicantName?: string
  applicantEmail?: string
  answers?: Record<string, unknown>
}

export type SubmissionStatusUpdatePayload = {
  status: Extract<SubmissionStatus, 'reviewed' | 'canceled'>
}

export type AuditEvent = {
  id: string
  actorId?: string
  actorType?: string
  action: string
  resource: string
  occurredAt: string
  requestId?: string
  correlationId?: string
}

export type UploadTicketRequest = {
  fileName: string
  contentType: string
  contentLength: number
}

export type UploadTicketResponse = {
  assetId: string
  uploadUrl: string
  uploadMethod?: string
  headers?: Record<string, string>
}

export type OrgAsset = {
  id: string
  fileName?: string
  contentType?: string
  url?: string
}

export type BrandingUpdatePayload = {
  logoAssetId: string
}

export type BrandingUpdateResponse = {
  logoAssetId: string
}
