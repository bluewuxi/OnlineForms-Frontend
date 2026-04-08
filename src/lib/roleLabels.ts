/**
 * Centralised human-readable labels for every role string used in this application.
 * Use this map anywhere a role string is rendered to a user so future role additions
 * only require updating one place.
 */
export const ROLE_LABELS: Record<string, string> = {
  org_viewer: 'Org Viewer',
  org_editor: 'Org Editor',
  org_admin: 'Org Admin',
  internal_admin: 'Internal Admin',
  platform_support: 'Platform Support',
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
