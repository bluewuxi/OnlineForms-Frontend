import { apiRequest, createIdempotencyKey } from './http'
import type {
  Course,
  CourseListItem,
  CursorPage,
  EnrollmentPayload,
  EnrollmentResponse,
} from './types'

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
  return apiRequest<CursorPage<CourseListItem>>({
    path: `/public/${tenantCode}/courses`,
    query: {
      q,
      limit,
      cursor,
    },
  })
}

export function getPublicCourse(tenantCode: string, courseId: string) {
  return apiRequest<Course>({
    path: `/public/${tenantCode}/courses/${courseId}`,
  })
}

export function createEnrollment(
  tenantCode: string,
  courseId: string,
  payload: EnrollmentPayload,
  idempotencyKey = createIdempotencyKey(),
) {
  return apiRequest<EnrollmentResponse>({
    path: `/public/${tenantCode}/courses/${courseId}/enrollments`,
    method: 'POST',
    headers: {
      'Idempotency-Key': idempotencyKey,
    },
    body: payload,
  })
}
