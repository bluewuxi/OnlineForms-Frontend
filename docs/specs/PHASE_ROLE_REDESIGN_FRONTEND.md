# OnlineForms Frontend — Role Redesign Phase

Source: Role design analysis following security hardening phase (FS-01–FS-06). Full
rationale and agreed design decisions are recorded in the backend repo at
`docs/reference/role-design.md`. Companion backend phase:
`OnlineForms/docs/specs/PHASE_ROLE_REDESIGN_BACKEND.md`.

## Goals

- Rename `platform_admin` to `platform_support` in all frontend role types, labels, and guards
- Add `org_viewer` as a first-class role in session handling, route guards, and UI rendering
- Hide write-action controls (buttons, forms) from `org_viewer` sessions throughout the org portal
- Surface the new `org_viewer` role in the invite creation UI
- Update the session context selector to present `org_viewer` as a valid role choice

## Scope

`src/lib/api/types.ts`, `src/lib/config/env.ts`, `src/features/org-session/`,
`src/app/routes.tsx`, all org portal page components that render write actions, and the
invite creation flow. No backend changes are in this phase.

## Workflow Rule

Implement tasks strictly in order. For each task:
1. Implement feature
2. Write brief change summary in linked GitHub issue
3. Update checklist status
4. Move to next task

## Tasks

- [x] FR-01 Rename `platform_admin` to `platform_support` in all frontend code
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/81
  Scope:
  - Find every string literal, type member, and display label that contains `platform_admin`
    and replace with `platform_support`. Key locations to check:
    - `src/lib/api/types.ts` — `AuthRole` or equivalent union type
    - `src/app/routes.tsx` — `allowedRoles` arrays on `RoleProtectedRoute`
    - `src/features/org-session/` — session validation helpers, `hasInternalCapability`
      or equivalent guards, portal-detection logic
    - `src/pages/org/ManagementEntryPage.tsx` — role comparison expressions
    - `src/pages/internal/` — any display labels showing the role name to the user
    - Any API response type that carries a `role` field with a `"platform_admin"` literal
  - Update the `AuthRole` (or `OrgRole`/`SessionRole`) TypeScript type to replace
    `"platform_admin"` with `"platform_support"` so the compiler catches stale references
  - Display label: wherever the role is shown to a user (e.g. role badge in the session
    header or user management table), render `"Platform Support"` instead of `"Platform Admin"`
  Acceptance:
  - No string `"platform_admin"` remains in `src/`
  - TypeScript compiler (`tsc --noEmit`) passes with zero errors
  - A user session carrying `role: "platform_support"` routes correctly to the internal portal
  - All existing tests pass

- [x] FR-02 Add `org_viewer` to frontend role types and session handling
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/82
  Scope:
  - Add `"org_viewer"` to the `AuthRole` (or equivalent) TypeScript union type in `types.ts`
  - Update the `OrgProtectedRoute` (or `requiresTenantContext` check) to treat `org_viewer`
    the same as `org_editor`/`org_admin` — requires a valid `tenantId` to proceed
  - Update `hasOrgTenantCapability` (or equivalent helper in session utilities) to return
    `true` for `org_viewer` alongside the other org roles
  - Update the session context selector (`OrgSessionContextPage` or equivalent) so that
    when a user has `org_viewer` membership in a tenant, it appears as a selectable context
    with a clear `"Org Viewer"` label (not `"Org Editor"` or `"Org Admin"`)
  - The `org_viewer` session context must satisfy the existing session validity checks —
    `isSessionUsable()` and related guards — without requiring any special casing
  Acceptance:
  - A mock session with `role: "org_viewer"` and a valid `tenantId` passes `OrgProtectedRoute`
    and loads the org portal
  - The session context selector renders a `"Org Viewer"` option for a user with that membership
  - `tsc --noEmit` passes
  - All existing tests pass; add a test confirming `org_viewer` satisfies tenant context checks

- [x] FR-03 Guard org portal write actions behind `org_editor` / `org_admin` role check
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/83
  Scope:
  - An `org_viewer` session must not see or be able to trigger any write action in the org
    portal. Audit every org portal page for write affordances and conditionally hide them
    based on whether the active role is `org_editor` or `org_admin`. Specific areas:
    - **Courses list page** — "New Course" button: hide for `org_viewer`
    - **Course detail / edit page** — "Edit", "Publish", "Archive" buttons: hide for `org_viewer`
    - **Form schema editor** — entire edit surface: hide / show read-only preview for `org_viewer`
    - **Submissions list / detail** — "Update Status" action: hide for `org_viewer`
    - **Branding page** — logo upload control and description editor: hide for `org_viewer`;
      show current branding values as read-only
    - **Team / invite page** — "Invite Member" button and form: hide for `org_viewer`
  - Implement a shared helper hook or utility, e.g. `useCanWrite(): boolean`, that returns
    `true` only when the active session role is `org_editor` or `org_admin`. Use this hook
    in every affected page rather than duplicating the role-check inline.
  - Do not redirect `org_viewer` away from pages — show the page in read-only mode with
    a brief inline notice where write actions have been removed, e.g.:
    `"You have read-only access to this tenant. Contact an Org Admin to make changes."`
  Acceptance:
  - An `org_viewer` session sees no write buttons across all org portal pages listed above
  - An `org_viewer` session still loads and reads all data successfully
  - Read-only notice is visible on at least the Branding and Form Schema pages
  - `org_editor` and `org_admin` sessions are unaffected — all write actions still appear
  - `useCanWrite` (or equivalent) has a unit test covering all three org roles

- [x] FR-04 Update invite creation UI to offer `org_viewer` as a role option
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/84
  Scope:
  - In the invite creation form (wherever `org_admin` can send a member invite), update the
    role selector to include `"Org Viewer"` as a valid option alongside `"Org Editor"` and
    `"Org Admin"`. The value submitted to the API must be the string `"org_viewer"`.
  - Add a short description beneath each role option in the selector to help admins choose:
    - Org Viewer — read-only; can browse courses, submissions, and audit history
    - Org Editor — can create and edit courses, form schemas, and assets
    - Org Admin — full control; can manage settings, submissions, and team members
  - Validate on the frontend that the submitted role is one of the three permitted values;
    show a field error if an unexpected value is present (defensive — the API will also reject)
  - Update any display in the pending-invites list or member table that shows the invited
    role to render `"Org Viewer"` correctly for the new value
  Acceptance:
  - Invite form role selector contains three options: Org Viewer, Org Editor, Org Admin
  - Submitting an invite with `org_viewer` role calls `POST /org/tenants/{tenantId}/invites`
    with `{ role: "org_viewer" }` in the body
  - Role descriptions are visible in the selector
  - Pending-invites list shows `"Org Viewer"` for invites with that role
  - All existing invite flow tests pass; add a test for the `org_viewer` invite path

- [x] FR-05 Update role display labels across internal portal user management
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/85
  Scope:
  - The internal portal user management pages (user list, user detail, role add/remove)
    display role names as labels. Update these to reflect both the rename and the new role:
    - `"platform_admin"` / `"Platform Admin"` → `"platform_support"` / `"Platform Support"`
    - Add `"org_viewer"` / `"Org Viewer"` wherever the role label map is defined
  - Implement or update a centralised role label map, e.g.:
    ```typescript
    const ROLE_LABELS: Record<AuthRole, string> = {
      org_viewer:       "Org Viewer",
      org_editor:       "Org Editor",
      org_admin:        "Org Admin",
      platform_support: "Platform Support",
      internal_admin:   "Internal Admin",
    }
    ```
    Use this map everywhere a role string is rendered to a human-readable label so future
    role additions only require updating one place.
  - Update the role add/remove form in user management to offer `"org_viewer"` and
    `"platform_support"` (not `"platform_admin"`) in the role selector
  Acceptance:
  - No `"Platform Admin"` label appears anywhere in the internal portal UI
  - `"Platform Support"` is shown correctly in user lists and role badges
  - `"Org Viewer"` appears in the role selector for user role management
  - All role names are sourced from the centralised label map
  - All existing internal portal tests pass

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

## Primary References

- `OnlineForms/docs/reference/role-design.md` — full role analysis and agreed design
- `OnlineForms/docs/specs/PHASE_ROLE_REDESIGN_BACKEND.md` — companion backend phase
- `src/lib/api/types.ts` — `AuthRole` and session type definitions
- `src/features/org-session/` — session context, route guards, and portal routing
- `src/app/routes.tsx` — route definitions and `RoleProtectedRoute` usage
- `src/pages/org/` — org portal pages with write actions to guard
- `src/pages/internal/` — internal portal user management pages
