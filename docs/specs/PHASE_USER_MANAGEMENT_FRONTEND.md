# OnlineForms Frontend — Tenant Portal User Management Phase

Source: Backend member management API (commit e97ce6a). Companion backend work is
already shipped — see `OnlineForms/services/api/src/lib/authMembers.ts` and the
backend commit for endpoint details.

## Goals

- Allow `org_admin` to view, invite, and remove users who have access to the tenant portal
- Allow `org_editor` to send invites (but not remove members)
- Allow `org_viewer` to view the member and invite lists in read-only mode
- Provide a "Copy invitation link" affordance so invites can be shared manually without
  relying on system-sent email

## API Contracts

Endpoints introduced by the backend (all under the org API base URL):

| Method   | Path                                          | Auth policy       |
|----------|-----------------------------------------------|-------------------|
| `GET`    | `/org/tenants/{tenantId}/members`             | `ORG_MEMBER_READ` |
| `DELETE` | `/org/tenants/{tenantId}/members/{userId}`    | `ORG_MEMBER_WRITE`|
| `PATCH`  | `/org/tenants/{tenantId}/members/{userId}`    | `ORG_MEMBER_WRITE`|
| `GET`    | `/org/tenants/{tenantId}/invites`             | `ORG_MEMBER_READ` |
| `POST`   | `/org/tenants/{tenantId}/invites`             | `ORG_MEMBER_WRITE`|

`ORG_MEMBER_READ` — accessible by all org roles and `platform_support`.
`ORG_MEMBER_WRITE` — accessible by `org_admin` only.

Member list response (`GET /members`):
```json
{ "data": [ { "userId": "...", "role": "org_admin", "status": "active", "activatedAt": "...", "createdAt": "..." } ] }
```

Invite list response (`GET /invites`):
```json
{ "data": [ { "inviteId": "...", "email": "...", "role": "org_editor", "status": "pending", "createdAt": "...", "expiresAt": "...", "acceptedAt": null } ] }
```

Backend safety guardrails:
- Cannot remove the last active `org_admin` → `409 CONFLICT`
- Cannot remove yourself → `409 CONFLICT`
- Cannot demote the last active `org_admin` → `409 CONFLICT`

## Tasks

- [x] FU-01 Add org member and invite API functions to `src/lib/api/org.ts`
  Scope:
  - `listOrgMembers(session)` → `GET /org/tenants/{tenantId}/members`
  - `removeOrgMember(session, userId)` → `DELETE /org/tenants/{tenantId}/members/{userId}`
  - `updateOrgMemberRole(session, userId, role)` → `PATCH /org/tenants/{tenantId}/members/{userId}`
  - Fix existing `listOrgInvites` path from `/org/invites` → `/org/tenants/{tenantId}/invites`
  - Fix existing `createOrgInvite` path from `/org/invites` → `/org/tenants/{tenantId}/invites`
  - Update `OrgMember` type to match backend shape: `{ userId, role, status, activatedAt, createdAt }`
  - Update `OrgInvite` type to match backend shape: `{ inviteId, email, role, status, createdAt, expiresAt, acceptedAt }`
  Acceptance:
  - All new functions call the correct tenant-scoped paths
  - List responses use `BackendItemEnvelope<T[]>` (non-paginated)
  - `tsc --noEmit` passes

- [x] FU-02 Rename TeamPage to Users page and add member list with remove action
  Scope:
  - Page title changed from "Team" to "Users"
  - Members section: table showing user ID, role, status, and joined date for all active members
  - Remove button visible to `org_admin` only; requires inline two-step confirmation
  - Backend guardrail errors (409) surface gracefully via mutation error state
  Acceptance:
  - All three org roles load the members table
  - `org_viewer` and `org_editor` see no Remove button
  - `org_admin` sees Remove → Confirm/Cancel flow
  - Removing the last admin or self shows a graceful error (surfaced from 409 response)

- [x] FU-03 Copy invitation link
  Scope:
  - After creating an invite (success state), show the full invite link and a "Copy link" button
  - Invite link format: `{origin}/org/accept-invite?inviteId={inviteId}`
  - In the pending invites table, each row has a "Copy link" button (available to all roles)
  - Button shows "Copied!" for 2 s after clicking, then reverts
  - Note: the `/org/accept-invite` frontend route and acceptance page are not yet built —
    the link can be copied now but cannot be followed until FU-04 is implemented
  Acceptance:
  - `navigator.clipboard.writeText` is called with the correct URL
  - "Copied!" feedback appears and clears after 2 s
  - Button is present on both the post-create success state and each pending invite row

- [ ] FU-04 Invite acceptance page at `/org/accept-invite`
  Scope:
  - Public or semi-public route that displays invite details (email, role, tenant)
  - If user is not authenticated, redirect to Cognito login with returnTo preserved
  - After login, call `POST /org/tenants/{tenantId}/invites/{inviteId}/accept`
  - On success, create a session for the new membership and redirect to `/org/submissions`
  - Handle errors: expired invite, email mismatch, already accepted
  Acceptance:
  - An unauthenticated user following the invite link is redirected to login then returned
  - A matching authenticated user can accept the invite and land in the org portal
  - Error states are shown for expired, mismatched, and already-accepted invites

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

## Primary References

- `OnlineForms/services/api/src/lib/authMembers.ts` — member management business logic
- `OnlineForms/docs/reference/api-contracts.md` sections 6.5–6.6 — full request/response contracts
- `src/lib/api/org.ts` — frontend API functions
- `src/lib/api/types.ts` — `OrgMember`, `OrgInvite`, `OrgRole` types
- `src/pages/org/TeamPage.tsx` — Users page component
