import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'

export function CourseDetailPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Course detail"
        title="Enrollment detail layout"
        description="A page shell reserved for course content, enrollment availability, and the public form renderer."
      />

      <LoadingState
        title="Enrollment form placeholder"
        message="The route is ready for API-driven course detail content and the embedded enrollment form."
      />
    </div>
  )
}
