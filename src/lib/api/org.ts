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
  InternalTenantProfile,
  InternalTenantCreatePayload,
  InternalTenantUpdatePayload,
  InternalAccessUser,
  UserSessionContext,
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

type BackendInternalTenant = {
  tenantId: string
  tenantCode: string
  displayName: string
  description?: string | null
  isActive: boolean
  homePageContent?: string | null
  updatedAt: string
}

type BackendInternalAccessUser = {
  userId: string
  username: string
  email?: string | null
  enabled: boolean
  status: string
}

type BackendUserSessionContext = {
  tenantId: string
  status: 'active' | 'invited' | 'suspended'
  roles: string[]
}

type BackendSessionContextsResponse = {
  userId: string
  tokenRole: string
  contexts: BackendUserSessionContext[]
}

type BackendSessionContextValidationResponse = {
  userId: string
  tenantId: string
  role: string
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

function mapInternalTenantProfile(
  tenant: BackendInternalTenant,
): InternalTenantProfile {
  return {
    tenantId: tenant.tenantId,
    tenantCode: tenant.tenantCode,
    displayName: tenant.displayName,
    description: tenant.description,
    isActive: tenant.isActive,
    homePageContent: tenant.homePageContent,
    updatedAt: tenant.updatedAt,
  }
}

function mapUserSessionContext(
  context: BackendUserSessionContext,
): UserSessionContext {
  return {
    tenantId: context.tenantId,
    status: context.status,
    roles: context.roles || [],
  }
}

function mapInternalAccessUser(
  user: BackendInternalAccessUser,
): InternalAccessUser {
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    enabled: user.enabled,
    status: user.status,
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

export function listInternalTenants(
  session: OrgSessionHeaders,
  limit = 100,
) {
  return apiRequest<BackendListEnvelope<BackendInternalTenant>>({
    path: '/internal/tenants',
    session,
    query: { limit },
  }).then((response) => ({
    ...response,
    data: {
      items: response.data.data.map(mapInternalTenantProfile),
      nextCursor: response.data.page.nextCursor,
    } satisfies CursorPage<InternalTenantProfile>,
  }))
}

export function updateInternalTenant(
  session: OrgSessionHeaders,
  tenantId: string,
  payload: InternalTenantUpdatePayload,
) {
  return apiRequest<BackendItemEnvelope<BackendInternalTenant>>({
    path: `/internal/tenants/${tenantId}`,
    method: 'PATCH',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: mapInternalTenantProfile(response.data.data),
  }))
}

export function getInternalTenant(
  session: OrgSessionHeaders,
  tenantId: string,
) {
  return apiRequest<BackendItemEnvelope<BackendInternalTenant>>({
    path: `/internal/tenants/${tenantId}`,
    session,
  }).then((response) => ({
    ...response,
    data: mapInternalTenantProfile(response.data.data),
  }))
}

export function createInternalTenant(
  session: OrgSessionHeaders,
  payload: InternalTenantCreatePayload,
) {
  return apiRequest<BackendItemEnvelope<BackendInternalTenant>>({
    path: '/internal/tenants',
    method: 'POST',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: mapInternalTenantProfile(response.data.data),
  }))
}

export function listInternalAccessUsers(
  session: OrgSessionHeaders,
  limit = 50,
  cursor?: string,
) {
  return apiRequest<BackendListEnvelope<BackendInternalAccessUser>>({
    path: '/internal/access-users',
    session,
    query: { limit, cursor },
  }).then((response) => ({
    ...response,
    data: {
      items: response.data.data.map(mapInternalAccessUser),
      nextCursor: response.data.page.nextCursor,
    } satisfies CursorPage<InternalAccessUser>,
  }))
}

export function listSessionContexts(session: OrgSessionHeaders) {
  return apiRequest<BackendItemEnvelope<BackendSessionContextsResponse>>({
    path: '/org/session-contexts',
    session,
  }).then((response) => ({
    ...response,
    data: {
      userId: response.data.data.userId,
      tokenRole: response.data.data.tokenRole,
      contexts: (response.data.data.contexts || []).map(mapUserSessionContext),
    },
  }))
}

export function validateSessionContext(
  session: OrgSessionHeaders,
  payload: { tenantId: string; role: string },
) {
  return apiRequest<BackendItemEnvelope<BackendSessionContextValidationResponse>>({
    path: '/org/session-context',
    method: 'POST',
    session,
    body: payload,
  }).then((response) => ({
    ...response,
    data: response.data.data,
  }))
}
