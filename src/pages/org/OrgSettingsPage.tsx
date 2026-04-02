import { PageHero } from '../../components/layout/PageHero'

export function OrgSettingsPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Org settings"
        title="Tenant settings and operational references"
        description="Keep branding and audit tools in one place so course authoring and submission review stay focused."
      />
    </div>
  )
}
