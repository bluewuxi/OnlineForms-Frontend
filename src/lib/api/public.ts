import { getFallbackTenantCodes } from '../config/env'
import { ApiClientError, apiRequest, createIdempotencyKey } from './http'
import type {
  Course,
  CourseListItem,
  CursorPage,
  EnrollmentPayload,
  EnrollmentResponse,
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
}

type BackendPublicCourse = BackendPublicCourseListItem & {
  fullDescription?: string
  enrollmentOpenAt?: string | null
  enrollmentCloseAt?: string | null
  enrollmentOpenNow?: boolean
}

type BackendTenantDirectoryItem = {
  tenantCode: string
  displayName?: string
  description?: string
  isActive?: boolean
  status?: string
}

type BackendTenantHome = {
  tenantCode: string
  displayName: string
  description?: string | null
  homePageContent?: string | null
  isActive: boolean
  branding?: {
    logoAssetId?: string | null
  }
  links?: {
    publishedCourses?: string
  }
}

function mapCourseListItem(course: BackendPublicCourseListItem): CourseListItem {
  return {
    id: course.id,
    title: course.title,
    summary: course.shortDescription,
    deliveryMode: course.deliveryMode,
    durationLabel:
      course.startDate && course.endDate
        ? `${course.startDate} to ${course.endDate}`
        : undefined,
    enrollmentStatus: undefined,
  }
}

function mapCourse(course: BackendPublicCourse): Course {
  return {
    ...mapCourseListItem(course),
    description: course.fullDescription,
    enrollmentOpensAt: course.enrollmentOpenAt ?? null,
    enrollmentClosesAt: course.enrollmentCloseAt ?? null,
    enrollmentStatus: course.enrollmentOpenNow ? 'open' : undefined,
    formVersion: null,
    formSchema: undefined,
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
    tenantCode,
    displayName:
      item.displayName?.trim() || prettifyTenantCode(tenantCode),
    description: item.description?.trim() || undefined,
    isActive:
      item.isActive ?? (item.status ? item.status.toLowerCase() === 'active' : true),
  }
}

function fallbackTenantDirectory(): TenantDirectoryItem[] {
  return getFallbackTenantCodes().map((tenantCode: string) => ({
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
      publishedCourses:
        item.links?.publishedCourses ||
        `/v1/public/${tenantCode}/courses`,
    },
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
    data: response.data.data,
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
