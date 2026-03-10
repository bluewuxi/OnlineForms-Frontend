import { apiRequest } from './http'
import type {
  AuditEvent,
  BrandingUpdatePayload,
  BrandingUpdateResponse,
  CourseStatus,
  CursorPage,
  DeliveryMode,
  FormField,
  FormSchemaUpsertPayload,
  FormSchemaUpsertResponse,
  OrgAsset,
  OrgCourseCreateResponse,
  OrgCourseStatusResponse,
  OrgCourse,
  OrgCourseSummary,
  OrgCourseUpdatePayload,
  OrgCourseUpsertPayload,
  OrgSessionHeaders,
  PricingMode,
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

type BackendOrgCourse = {
  id: string
  title: string
  shortDescription: string
  fullDescription: string
  startDate: string
  endDate: string
  enrollmentOpenAt: string
  enrollmentCloseAt: string
  deliveryMode: DeliveryMode
  locationText?: string | null
  capacity?: number | null
  status: CourseStatus
  publicVisible: boolean
  pricingMode: PricingMode
  paymentEnabledFlag: boolean
  imageAssetId?: string | null
  activeFormId?: string | null
  activeFormVersion?: number | null
  createdAt: string
  updatedAt: string
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

function mapOrgCourse(course: BackendOrgCourse): OrgCourse {
  return {
    id: course.id,
    title: course.title,
    shortDescription: course.shortDescription,
    fullDescription: course.fullDescription,
    startDate: course.startDate,
    endDate: course.endDate,
    enrollmentOpenAt: course.enrollmentOpenAt,
    enrollmentCloseAt: course.enrollmentCloseAt,
    deliveryMode: course.deliveryMode,
    locationText: course.locationText,
    capacity: course.capacity,
    status: course.status,
    publicVisible: course.publicVisible,
    pricingMode: course.pricingMode,
    paymentEnabledFlag: course.paymentEnabledFlag,
    imageAssetId: course.imageAssetId,
    activeFormId: course.activeFormId,
    activeFormVersion: course.activeFormVersion,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  }
}

function mapOrgCourseSummary(course: BackendOrgCourse): OrgCourseSummary {
  return {
    id: course.id,
    title: course.title,
    shortDescription: course.shortDescription,
    startDate: course.startDate,
    endDate: course.endDate,
    deliveryMode: course.deliveryMode,
    status: course.status,
    publicVisible: course.publicVisible,
    pricingMode: course.pricingMode,
    activeFormVersion: course.activeFormVersion,
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

export function listCourses(session: OrgSessionHeaders) {
  return apiRequest<BackendListEnvelope<BackendOrgCourse>>({
    path: '/org/courses',
    session,
  }).then((response) => ({
    ...response,
    data: {
      items: response.data.data.map(mapOrgCourseSummary),
      nextCursor: response.data.page.nextCursor,
    } satisfies CursorPage<OrgCourseSummary>,
  }))
}

export function getCourse(session: OrgSessionHeaders, courseId: string) {
  return apiRequest<BackendItemEnvelope<BackendOrgCourse>>({
    path: `/org/courses/${courseId}`,
    session,
  }).then((response) => ({
    ...response,
    data: mapOrgCourse(response.data.data),
  }))
}

export function createCourse(
  session: OrgSessionHeaders,
  payload: OrgCourseUpsertPayload,
) {
  return apiRequest<BackendItemEnvelope<OrgCourseCreateResponse>>({
    path: '/org/courses',
    method: 'POST',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}

export function updateCourse(
  session: OrgSessionHeaders,
  courseId: string,
  payload: OrgCourseUpdatePayload,
) {
  return apiRequest<BackendItemEnvelope<BackendOrgCourse>>({
    path: `/org/courses/${courseId}`,
    method: 'PATCH',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: mapOrgCourse(response.data.data),
  }))
}

export function publishCourse(session: OrgSessionHeaders, courseId: string) {
  return apiRequest<BackendItemEnvelope<OrgCourseStatusResponse>>({
    path: `/org/courses/${courseId}/publish`,
    method: 'POST',
    session,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}

export function archiveCourse(session: OrgSessionHeaders, courseId: string) {
  return apiRequest<BackendItemEnvelope<OrgCourseStatusResponse>>({
    path: `/org/courses/${courseId}/archive`,
    method: 'POST',
    session,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
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
