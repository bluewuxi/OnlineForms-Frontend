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
  username?: string
  preferredName?: string
  tenantId?: string
  role: string
  accessToken?: string
  idToken?: string
  refreshToken?: string
  expiresAtEpochSeconds?: number
  authProvider?: 'mock' | 'cognito'
}

export type DeliveryMode = 'online' | 'onsite' | 'hybrid'
export type PricingMode = 'free' | 'paid_placeholder'
export type CourseStatus = 'draft' | 'published' | 'archived'

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
  enrollmentStatus?: 'upcoming' | 'open' | 'closed'
  enrollmentOpenNow?: boolean
  locationText?: string | null
  links?: {
    detail?: string
    enrollmentForm?: string
  }
}

export type Course = CourseListItem & {
  description?: string
  enrollmentOpensAt?: string | null
  enrollmentClosesAt?: string | null
  capacity?: number | null
  formAvailable?: boolean
  formVersion?: number | null
  formSchema?: FormSchema | Record<string, unknown>
}

export type OrgCourse = {
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

export type OrgCourseSummary = Pick<
  OrgCourse,
  | 'id'
  | 'title'
  | 'shortDescription'
  | 'startDate'
  | 'endDate'
  | 'deliveryMode'
  | 'status'
  | 'publicVisible'
  | 'pricingMode'
  | 'activeFormVersion'
>

export type OrgCourseUpsertPayload = {
  title: string
  shortDescription: string
  fullDescription: string
  startDate: string
  endDate: string
  enrollmentOpenAt: string
  enrollmentCloseAt: string
  deliveryMode: DeliveryMode
  locationText: string | null
  capacity: number | null
  pricingMode: PricingMode
  imageAssetId: string | null
}

export type OrgCourseUpdatePayload = Partial<OrgCourseUpsertPayload> & {
  publicVisible?: boolean
}

export type OrgCourseCreateResponse = {
  id: string
  status: CourseStatus
}

export type OrgCourseStatusResponse = {
  id: string
  status: CourseStatus
  publicVisible: boolean
}

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'phone'
  | 'number'
  | 'single_select'
  | 'multi_select'
  | 'checkbox'
  | 'date'

export type FormFieldOption = {
  value: string
  label: string
}

export type FormFieldValidation = {
  minLength?: number | null
  maxLength?: number | null
  pattern?: string | null
  min?: number | null
  max?: number | null
}

export type FormField = {
  fieldId: string
  type: FormFieldType
  label: string
  helpText?: string | null
  required?: boolean
  displayOrder?: number
  options?: FormFieldOption[]
  validation?: FormFieldValidation
}

export type FormSchema = {
  id?: string
  courseId?: string
  version: number
  fields: FormField[]
}

export type FormSchemaUpsertPayload = {
  fields: FormField[]
}

export type FormSchemaUpsertResponse = {
  formId: string
  version: number
}

export type EnrollmentPayload = {
  formVersion: number
  answers: Record<string, unknown>
  meta?: {
    locale?: string
    timezone?: string
  }
  /** FS-04: Cloudflare Turnstile token for server-side CAPTCHA verification. */
  _captchaToken?: string
  /** FS-03: Honeypot flag — true if the hidden honeypot field was filled (bot indicator). */
  _hp?: boolean
}

export type EnrollmentResponse = {
  submissionId: string
  status: string
  submittedAt?: string
  tenantCode?: string
  courseId?: string
  courseTitle?: string
  links?: {
    tenantHome?: string
    course?: string
  }
}

export type SubmissionStatus = 'submitted' | 'reviewed' | 'canceled'

export type Submission = {
  id: string
  courseId: string
  courseTitle?: string
  formId?: string
  formVersion?: number
  status: SubmissionStatus
  submittedAt: string
  reviewedAt?: string | null
  reviewedBy?: string | null
  createdAt?: string
  tenantCode?: string
  applicant?: Record<string, unknown>
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
  resourceType?: string
  occurredAt: string
  requestId?: string
  correlationId?: string
}

export type UploadTicketRequest = {
  purpose: 'course_image' | 'org_logo'
  fileName: string
  contentType: string
  sizeBytes: number
}

export type UploadTicketResponse = {
  assetId: string
  uploadUrl: string
  method?: string
  /** Presigned POST form fields — present when method is POST */
  fields?: Record<string, string>
  /** Legacy presigned PUT headers — present when method is PUT */
  headers?: Record<string, string>
  expiresAt?: string
  publicUrl?: string
}

export type OrgAsset = {
  id: string
  fileName?: string
  contentType?: string
  publicUrl?: string
  url?: string
}

export type BrandingUpdatePayload = {
  logoAssetId?: string | null
  description?: string | null
  homePageContent?: string | null
}

export type BrandingSettings = {
  tenantId?: string
  displayName?: string
  description?: string | null
  homePageContent?: string | null
  logoAssetId: string | null
  logoUrl?: string | null
  updatedAt?: string
}

export type BrandingUpdateResponse = BrandingSettings

export type TenantDirectoryItem = {
  tenantId: string
  tenantCode: string
  displayName: string
  description?: string
  isActive?: boolean
  branding?: {
    logoAssetId?: string | null
    logoUrl?: string | null
  }
  links?: {
    home?: string
    courses?: string
  }
}

export type TenantHome = {
  tenantCode: string
  displayName: string
  description?: string
  homePageContent?: string
  isActive: boolean
  branding?: {
    logoAssetId?: string | null
    logoUrl?: string | null
  }
  links: {
    home?: string
    publishedCourses: string
  }
}

export type AuthRoleOption = {
  role: string
  label: string
  requiresTenant: boolean
}

export type UserSessionContext = {
  tenantId: string
  status: 'active' | 'invited' | 'suspended'
  roles: string[]
}

export type InternalTenantProfile = {
  tenantId: string
  tenantCode: string
  displayName: string
  description?: string | null
  isActive: boolean
  homePageContent?: string | null
  updatedAt: string
}

export type InternalTenantUpdatePayload = {
  displayName?: string
  description?: string | null
  isActive?: boolean
  homePageContent?: string | null
}

export type InternalTenantCreatePayload = {
  tenantCode: string
  displayName: string
  description?: string | null
  isActive?: boolean
  homePageContent?: string | null
}

export type InternalAccessUser = {
  userId: string
  username: string
  email?: string | null
  preferredName?: string | null
  enabled: boolean
  status: string
  internalRoles: InternalRole[]
}

export type InternalUserMembership = {
  tenantId: string
  status: 'active' | 'invited' | 'suspended'
  roles: string[]
}

export type InternalRole = 'internal_admin' | 'platform_support'

export type InternalAccessUserDetail = InternalAccessUser & {
  memberships: InternalUserMembership[]
}

export type InternalUserCreatePayload = {
  email: string
  preferredName?: string | null
  password: string
  temporaryPassword?: boolean
  internalRoles: InternalRole[]
  enabled?: boolean
}

export type InternalUserRoleMutationPayload = {
  role: InternalRole
}

export type InternalUserPasswordResetPayload = {
  password: string
}

export type InternalUserPasswordResetResult = {
  userId: string
  passwordReset: true
  temporaryPassword: true
}

export type InternalUserActivityEvent = {
  id: string
  userId: string
  actorUserId?: string | null
  eventType:
    | 'internal_user.created'
    | 'internal_user.role_added'
    | 'internal_user.role_removed'
    | 'internal_user.activated'
    | 'internal_user.deactivated'
    | 'internal_user.password_reset'
    | 'internal_user.login'
    | 'internal_user.logout'
  summary: string
  details: Record<string, unknown>
  createdAt: string
}

export type InternalUserActivityPage = CursorPage<InternalUserActivityEvent> & {
  sourceStatus: 'ok' | 'unavailable'
}

export type OrgRole = 'org_viewer' | 'org_editor' | 'org_admin'

export type OrgMember = {
  userId: string
  email?: string | null
  preferredName?: string | null
  role: OrgRole
  status: 'active' | 'invited' | 'suspended'
  invitedAt?: string | null
  joinedAt?: string | null
}

export type OrgInvitePayload = {
  email: string
  role: OrgRole
}

export type OrgInvite = {
  inviteId: string
  email: string
  role: OrgRole
  status: 'pending' | 'accepted' | 'expired'
  invitedAt: string
  expiresAt?: string | null
}
