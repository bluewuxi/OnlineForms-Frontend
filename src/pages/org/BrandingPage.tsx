import { EmptyState } from '../../components/feedback/EmptyState'
import { PageHero } from '../../components/layout/PageHero'

export function BrandingPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Branding utility"
        title="Asset upload and branding"
        description="A reserved utility route for tenant logo upload and branding updates."
      />

      <EmptyState
        title="Branding controls arrive in Phase F4"
        message="This route is reserved now so the org shell and navigation structure stay stable while we build the rest of the MVP."
      />
    </div>
  )
}
