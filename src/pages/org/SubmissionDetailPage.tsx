import { LoadingState } from '../../components/feedback/LoadingState'
import { PageHero } from '../../components/layout/PageHero'

export function SubmissionDetailPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Submission detail"
        title="Submission review details"
        description="A focused route for reviewing one submission and applying workflow status changes."
      />

      <LoadingState
        title="Submission detail layout ready"
        message="The shell is prepared for detail data, response rendering, and status actions."
      />
    </div>
  )
}
