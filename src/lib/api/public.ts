import { getFallbackTenantCodes } from '../config/env'
import { ApiClientError, apiRequest, createIdempotencyKey } from './http'
import type {
  Course,
  CourseListItem,
  CursorPage,
  EnrollmentPayload,
  EnrollmentResponse,
  AuthRoleOption,
  FormSchema,
  TenantDirectoryItem,
  TenantHome,
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

type BackendPublicCourseListItem = {
  id: string
  title: string
  shortDescription?: string
  deliveryMode?: string
  startDate?: string
  endDate?: string
  locationText?: string | null
  enrollmentOpenAt?: string | null
  enrollmentCloseAt?: string | null
  enrollmentOpenNow?: boolean
  enrollmentStatus?: 'upcoming' | 'open' | 'closed'
  links?: {
    detail?: string
    enrollmentForm?: string
  }
}

type BackendPublicCourse = BackendPublicCourseListItem & {
  fullDescription?: string
  capacity?: number | null
  formAvailable?: boolean
  formVersion?: number | null
  formSchema?: FormSchema | null
}

type BackendTenantDirectoryItem = {
  tenantId: string
  tenantCode: string
  displayName?: string
  description?: string
  isActive?: boolean
  status?: string
  branding?: {
    logoAssetId?: string | null
    logoUrl?: string | null
  }
  links?: {
    home?: string
    courses?: string
  }
}

type BackendTenantHome = {
  tenantCode: string
  displayName: string
  description?: string | null
  homePageContent?: string | null
  isActive: boolean
  branding?: {
    logoAssetId?: string | null
    logoUrl?: string | null
  }
  links?: {
    home?: string
    publishedCourses?: string
  }
}

type BackendAuthRoleOption = {
  role: string
  label: string
  requiresTenant: boolean
}

function toPublicAppPath(path?: string, tenantCode?: string, fallback?: string) {
  if (!path) {
    return fallback
  }

  const normalizedTenantCode = tenantCode?.trim().toLowerCase()
  if (normalizedTenantCode) {
    if (path === `/v1/public/${normalizedTenantCode}/tenant-home`) {
      return `/${normalizedTenantCode}`
    }

    const courseDetailPrefix = `/v1/public/${normalizedTenantCode}/courses/`
    if (path.startsWith(courseDetailPrefix)) {
      const suffix = path.slice(courseDetailPrefix.length)
      if (suffix.endsWith('/form')) {
        const courseId = suffix.slice(0, -'/form'.length)
        return `/${normalizedTenantCode}/courses/${courseId}`
      }
      return `/${normalizedTenantCode}/courses/${suffix}`
    }

    if (path === `/v1/public/${normalizedTenantCode}/courses`) {
      return `/${normalizedTenantCode}/courses`
    }
  }

  return fallback
}

function extractTenantCodeFromPublicPath(path?: string) {
  if (!path) {
    return undefined
  }

  const match = path.match(/^\/v1\/public\/([^/]+)/)
  return match?.[1]?.trim().toLowerCase()
}

function mapCourseListItem(course: BackendPublicCourseListItem): CourseListItem {
  const tenantCodeFromLinks =
    extractTenantCodeFromPublicPath(course.links?.detail) ||
    extractTenantCodeFromPublicPath(course.links?.enrollmentForm)
  const detailLink = toPublicAppPath(
    course.links?.detail,
    tenantCodeFromLinks,
    undefined,
  )
  const enrollmentFormLink = toPublicAppPath(
    course.links?.enrollmentForm,
    tenantCodeFromLinks,
    detailLink,
  )
  return {
    id: course.id,
    title: course.title,
    summary: course.shortDescription,
    deliveryMode: course.deliveryMode,
    durationLabel:
      course.startDate && course.endDate
        ? `${course.startDate} to ${course.endDate}`
        : undefined,
    enrollmentStatus: course.enrollmentStatus,
    enrollmentOpenNow: course.enrollmentOpenNow,
    locationText: course.locationText ?? undefined,
    links: {
      detail: detailLink,
      enrollmentForm: enrollmentFormLink,
    },
  }
}

function mapCourse(course: BackendPublicCourse): Course {
  return {
    ...mapCourseListItem(course),
    description: course.fullDescription,
    enrollmentOpensAt: course.enrollmentOpenAt ?? null,
    enrollmentClosesAt: course.enrollmentCloseAt ?? null,
    enrollmentStatus: course.enrollmentStatus,
    enrollmentOpenNow: course.enrollmentOpenNow,
    locationText: course.locationText ?? undefined,
    capacity: course.capacity ?? null,
    formAvailable: course.formAvailable ?? false,
    formVersion: course.formVersion ?? null,
    formSchema: course.formSchema ?? undefined,
  }
}

function prettifyTenantCode(tenantCode: string) {
  return tenantCode
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapTenantDirectoryItem(
  item: BackendTenantDirectoryItem,
): TenantDirectoryItem {
  const tenantCode = item.tenantCode.trim().toLowerCase()
  return {
    tenantId: item.tenantId,
    tenantCode,
    displayName:
      item.displayName?.trim() || prettifyTenantCode(tenantCode),
    description: item.description?.trim() || undefined,
    isActive:
      item.isActive ?? (item.status ? item.status.toLowerCase() === 'active' : true),
    branding: item.branding,
    links: {
      home: toPublicAppPath(item.links?.home, tenantCode, `/${tenantCode}`),
      courses: toPublicAppPath(
        item.links?.courses,
        tenantCode,
        `/${tenantCode}/courses`,
      ),
    },
  }
}

function fallbackTenantDirectory(): TenantDirectoryItem[] {
  return getFallbackTenantCodes().map((tenantCode: string) => ({
    tenantId: tenantCode,
    tenantCode,
    displayName: prettifyTenantCode(tenantCode),
    description: 'Browse available courses for this tenant.',
    isActive: true,
  }))
}

function mapTenantHome(item: BackendTenantHome): TenantHome {
  const tenantCode = item.tenantCode.trim().toLowerCase()
  return {
    tenantCode,
    displayName: item.displayName?.trim() || prettifyTenantCode(tenantCode),
    description: item.description?.trim() || undefined,
    homePageContent: item.homePageContent?.trim() || undefined,
    isActive: item.isActive !== false,
    branding: item.branding,
    links: {
      home:
        toPublicAppPath(item.links?.home, tenantCode, `/${tenantCode}`) ||
        `/${tenantCode}`,
      publishedCourses:
        toPublicAppPath(
          item.links?.publishedCourses,
          tenantCode,
          `/${tenantCode}/courses`,
        ) || `/${tenantCode}/courses`,
    },
  }
}

function mapAuthRoleOption(item: BackendAuthRoleOption): AuthRoleOption {
  return {
    role: item.role,
    label: item.label,
    requiresTenant: item.requiresTenant !== false,
  }
}

type PublicCourseListParams = {
  tenantCode: string
  q?: string
  limit?: number
  cursor?: string
}

export function listPublicCourses({
  tenantCode,
  q,
  limit,
  cursor,
}: PublicCourseListParams) {
  return apiRequest<BackendListEnvelope<BackendPublicCourseListItem>>({
    path: `/public/${tenantCode}/courses`,
    query: {
      q,
      limit,
      cursor,
    },
  }).then((response) => ({
    ...response,
    data: {
      items: response.data.data.map(mapCourseListItem),
      nextCursor: response.data.page.nextCursor,
    } satisfies CursorPage<CourseListItem>,
  }))
}

export function getPublicCourse(tenantCode: string, courseId: string) {
  return apiRequest<BackendItemEnvelope<BackendPublicCourse>>({
    path: `/public/${tenantCode}/courses/${courseId}`,
  }).then((response) => ({
    ...response,
    data: mapCourse(response.data.data),
  }))
}

export function createEnrollment(
  tenantCode: string,
  courseId: string,
  payload: EnrollmentPayload,
  idempotencyKey = createIdempotencyKey(),
) {
  return apiRequest<BackendItemEnvelope<EnrollmentResponse>>({
    path: `/public/${tenantCode}/courses/${courseId}/enrollments`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: payload,
  }).then((response) => ({
    ...response,
    data: {
      ...response.data.data,
      links: response.data.data.links
        ? {
            tenantHome: toPublicAppPath(
              response.data.data.links.tenantHome,
              response.data.data.tenantCode ?? tenantCode,
              `/${tenantCode}`,
            ),
            course: toPublicAppPath(
              response.data.data.links.course,
              response.data.data.tenantCode ?? tenantCode,
              `/${tenantCode}/courses/${courseId}`,
            ),
          }
        : undefined,
    },
  }))
}

export async function listPublicTenants() {
  try {
    const response =
      await apiRequest<BackendListEnvelope<BackendTenantDirectoryItem>>({
        path: '/public/tenants',
      })

    return {
      ...response,
      data: response.data.data
        .map(mapTenantDirectoryItem)
        .filter((tenant) => tenant.isActive !== false),
    }
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.status === 404 || error.status === 501)
    ) {
      return {
        data: fallbackTenantDirectory(),
        requestId: undefined,
        correlationId: 'fallback_tenant_directory',
      }
    }
    throw error
  }
}

export function getPublicTenantHome(tenantCode: string) {
  return apiRequest<BackendItemEnvelope<BackendTenantHome>>({
    path: `/public/${tenantCode}/tenant-home`,
  }).then((response) => ({
    ...response,
    data: mapTenantHome(response.data.data),
  }))
}

export function getPublicAuthOptions() {
  return apiRequest<{ data: { roles: BackendAuthRoleOption[] } }>({
    path: '/public/auth-options',
  }).then((response) => ({
    ...response,
    data: {
      roles: (response.data.data.roles || []).map(mapAuthRoleOption),
    },
  }))
}
