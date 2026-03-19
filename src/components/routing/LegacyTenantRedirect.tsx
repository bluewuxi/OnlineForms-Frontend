import { Navigate, useParams } from 'react-router-dom'
import { isValidTenantCode, normalizeTenantCode } from '../../lib/routing/tenantCode'
import { NotFoundPage } from '../../pages/NotFoundPage'

type LegacyTenantRedirectProps = {
  includeCourseId?: boolean
}

export function LegacyTenantRedirect({ includeCourseId = false }: LegacyTenantRedirectProps) {
  const { tenantCode, courseId } = useParams()

  if (!tenantCode || !isValidTenantCode(tenantCode)) {
    return <NotFoundPage />
  }
  if (includeCourseId && !courseId) {
    return <NotFoundPage />
  }

  const normalizedTenantCode = normalizeTenantCode(tenantCode)
  const destination = includeCourseId
    ? `/${normalizedTenantCode}/courses/${courseId ?? ''}`
    : `/${normalizedTenantCode}/courses`

  return <Navigate replace to={destination} />
}
