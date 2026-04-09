# OnlineForms Frontend Implementation Checklist

Source spec: `FRONTEND_MVP_SPEC.md`

## Phase F1 - Foundation

- [x] F1-01 Initialize React + Vite + TypeScript app scaffold and baseline tooling (#1)
- [x] F1-02 Build shared app shell, routing structure, and global UX states (#2)
- [x] F1-03 Implement typed API client, environment config, and request helpers (#3)
- [x] F1-04 Add MVP org auth shell and header-based session handling (#4)

## Phase F2 - Public Experience

- [x] F2-01 Build public course catalog with search, pagination, and empty states (#5)
- [x] F2-02 Build public course detail page with enrollment form rendering (#6)
- [x] F2-03 Implement enrollment submission flow, success states, and error handling (#7)

Delivered backend-alignment refinements:
- `F2-01` now consumes backend-provided public links, enrollment status, and location metadata.
- `F2-02` now consumes course capacity and form-availability metadata.
- `F2-03` now consumes enrollment success links and course-title metadata.

## Phase F3 - Organization Portal

- [x] F3-01 Build org submissions list with filters and cursor pagination (#8)
- [x] F3-02 Build submission detail view and status update workflow (#9)
- [x] F3-03 Build tenant audit event view with filters and pagination (#10)

## Phase F4 - Utilities, Quality, and Release

- [x] F4-01 Build asset upload and branding utility screen (#11)
- [x] F4-02 Add accessibility pass, critical frontend tests, and smoke checklist (#12)
- [x] F4-03 Prepare S3/CloudFront deployment-ready build configuration and delivery notes (#13)

## Phase F5 - Form Designer

- [x] F5-01 Build org form schema loader and editor shell (#14)
- [x] F5-02 Build field editor for labels, help text, type, and required state (#15)
- [x] F5-03 Build option, ordering, and validation controls (#16)
- [x] F5-04 Add form schema save/version workflow and test coverage (#17)

## Phase F6 - Org Course Management

- [ ] F6-01 Build org course list page with status and visibility indicators (#21)
- [ ] F6-02 Build org course create/edit form workflow (#19)
- [ ] F6-03 Add publish/archive actions with feedback states (#18)
- [ ] F6-04 Link course records to the form designer and org navigation (#20)

## Phase F7 - Tenant Experience and Internal Management

- [x] F7-01 Route model update for tenant-first URLs and reserved slug handling (#22)
- [x] F7-02 Root home IA refresh and tenant card navigation (#23)
- [x] F7-03 Tenant home page and course-list CTA (#24)
- [x] F7-04 Internal tenant management screens (update-only) (#25)
- [x] F7-05 Internal management role-aware access control (#26)
- [x] F7-06 Reserved slug guardrails, QA, and docs (#27)
- [x] F7-07 Management login UX polish (menu label + tenant/role dropdowns) (#28)
- [x] F7-08 Unified login flow with role-safe redirects and tenant auto-clear (#29)

Delivered backend-alignment refinements:
- `F7-03` now consumes tenant branding/logo metadata and backend-provided tenant navigation links.

## Phase F8 - Cognito Login Workflow

- [x] F8-01 Cognito login UI integration and token acquisition (#30)
- [x] F8-02 Session/token storage model with expiry handling (#32)
- [x] F8-03 Access token refresh and 401 recovery flow (#33)
- [x] F8-04 Auth guard/redirect hardening and end-to-end smoke pack (#31)

## Phase F9 - Hosted UI Context Selection (Extensible)

- [x] F9-01 Hosted UI post-login tenant/role context selection flow (#36)
- [x] F9-02 Login UX hardening and context error diagnostics (#34)
- [x] F9-03 Extensible auth UX backlog slot for upcoming features (#35)
- [x] F9-04 Dual-intent login UX (tenant portal vs internal portal) (#38)
- [x] F9-05 Internal-access UX diagnostics and supportability (#37)
- [x] F9-06 Internal portal directory UI (tenants + internal-access users) (#39)
- [x] F9-07 Direct Hosted UI entry and post-auth internal-management shortcut (#40)

## Phase F10 - Internal Portal Improvement

- [x] F10-01 Internal portal top navigation and layout shell (#41)
- [x] F10-02 Internal tenants drawer workflow (list/edit/create) (#42)
- [x] F10-03 Internal logout flow (clear session and redirect public home) (#43)
- [x] F10-04 Internal users drawer workflow (list/add/remove access) (#44)
- [x] F10-05 Internal home page at `/internal` (#45)

## Phase F11 - UI Improvements

- [x] F11-01 Shared visual system and layout primitives (#51)
- [ ] F11-02 Public portal IA, navigation, and visual refresh (#47)
- [ ] F11-03 Enrollment form and success-state UX polish (#48)
- [ ] F11-04 Organization portal navigation and course-first workspace refresh (#49)
- [ ] F11-05 Internal portal density and drawer UX refinement (#50)
- [ ] F11-06 Responsive, accessibility, and UI polish pass (#46)

Detailed rollout checklist: `docs/specs/PHASE_F11_UI_IMPROVEMENTS.md`

## User Management Phase

- [x] FU-01 Org member and invite API functions with correct tenant-scoped paths (#86)
- [x] FU-02 Users page: member list with remove action and role-based access control (#87)
- [x] FU-03 Copy invitation link from post-create success state and pending invites table (#88)
- [ ] FU-04 Invite acceptance page at `/org/accept-invite` (#89)

Detailed rollout checklist: `docs/specs/PHASE_USER_MANAGEMENT_FRONTEND.md`

## Security Hardening Phase

- [x] FS-01 Enrollment form field length constraints — `maxLength` on all text inputs, live counter for textareas (#75)
- [x] FS-02 Friendly 429 rate-limit error state — distinct banner, no retry button (#76)
- [x] FS-03 Honeypot field on public enrollment form — silently discards bot submissions (#77)
- [x] FS-04 CAPTCHA widget integration (Cloudflare Turnstile) — blocks submit until token received (#78)
- [x] FS-05 XSS hygiene — `noopener noreferrer` on all `target="_blank"` links, ESLint rule (#79)
- [x] FS-06 Dependency vulnerability scanning — `npm audit` in CI, Dependabot weekly (#80)

Detailed rollout checklist: `docs/specs/PHASE_SECURITY_FRONTEND.md`
