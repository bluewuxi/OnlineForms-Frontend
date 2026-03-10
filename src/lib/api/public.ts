import { apiRequest, createIdempotencyKey } from './http'
import type {
  Course,
  CourseListItem,
  CursorPage,
  EnrollmentPayload,
  EnrollmentResponse,
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
