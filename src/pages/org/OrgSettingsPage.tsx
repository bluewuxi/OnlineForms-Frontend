import { OrgWorkspaceNav } from '../../components/layout/OrgWorkspaceNav'
import { PageHero } from '../../components/layout/PageHero'

export function OrgSettingsPage() {
  return (
    <div className="page-stack">
      <PageHero
        badge="Org settings"
        title="Tenant settings and operational references"
        description="Keep branding and audit tools in one place so course authoring and submission review stay focused."
      />

      <OrgWorkspaceNav
        eyebrow="Settings workspace"
        title="Manage tenant configuration and visibility"
        items={[
          {
            label: 'Branding',
            description: 'Upload the tenant logo and update the public-facing brand asset.',
            to: '/org/branding',
          },
          {
            label: 'Audit',
            description: 'Inspect recent tenant actions, actors, and trace identifiers.',
            to: '/org/audit',
          },
        ]}
      />
    </div>
  )
}
