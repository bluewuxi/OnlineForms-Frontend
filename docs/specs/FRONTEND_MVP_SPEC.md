# OnlineForms Frontend MVP Spec

Version: 0.3 (Draft)
Date: 2026-03-10
Repository: bluewuxi/OnlineForms-Frontend
Backend API: https://form-api.kidrawer.com/v1

## 1. Purpose

Define the MVP scope for the OnlineForms frontend so potential customers can experience the product through a usable web portal, while staying aligned with the current backend delivery.

## 2. Product Surfaces

The frontend MVP includes two surfaces:

1. Public Portal (anonymous users)
2. Organization Portal (org users)

## 3. MVP Goals

1. Present a polished public course discovery and enrollment experience.
2. Allow organization users to review and manage submissions.
3. Demonstrate key SaaS value in customer demos with realistic workflows.
4. Integrate directly with current backend APIs without changing backend contracts.

## 4. Non-Goals (Frontend MVP)

1. Payment checkout UI (payments remain disabled/stubbed).
2. Advanced design system/theming engine.
3. Multi-language localization.
4. Rich analytics dashboards.
5. Full tenant settings administration UI.

## 5. Target Users

### 5.1 Public Applicant

- Browses courses
- Opens course details
- Submits enrollment form

### 5.2 Organization User

- Signs in (or uses MVP auth shell)
- Manages courses
- Lists submissions
- Opens submission details
- Updates submission status
- Reviews audit events

## 6. Information Architecture

### 6.1 Public Routes

- `/:tenantCode` (tenant home page)
- `/:tenantCode/courses` (catalog)
- `/:tenantCode/courses/:courseId` (detail)
- Enrollment form embedded in course detail page
- Enrollment success state on submit
- Legacy `/t/:tenantCode/*` routes are deprecated and should redirect when encountered

### 6.2 Org Routes

- `/org/login` (MVP auth shell)
- `/org/courses`
- `/org/courses/new`
- `/org/courses/:courseId`
- `/org/submissions`
- `/org/submissions/:submissionId`
- `/org/audit`
- `/org/branding`
- `/org/courses/:courseId/form`
- `/internal/tenants` (internal management list/edit shell)

### 6.3 Shared

- `/` lightweight landing with links to public/org portals
- Not found and error pages

## 7. Functional Requirements

## 7.1 Public Catalog

- Fetch and render published courses by tenant code.
- Support query string search (`q`) and pagination (`limit`, `cursor`).
- Show empty-state messaging when no courses are found.

APIs:
- `GET /public/{tenantCode}/courses`

## 7.2 Public Course Detail + Enrollment

- Render course detail fields and enrollment window status.
- Render form based on API-provided schema version assumptions in current backend.
- Submit enrollment with idempotency key.
- Show success and error states.

APIs:
- `GET /public/{tenantCode}/courses/{courseId}`
- `POST /public/{tenantCode}/courses/{courseId}/enrollments`

## 7.3 Org Submission Review

- List submissions with filters (course/status/date range) and cursor pagination.
- Open submission detail view.
- Update submission status (`reviewed` or `canceled`) with optimistic UI and error handling for stale transitions.

APIs:
- `GET /org/submissions`
- `GET /org/submissions/{submissionId}`
- `PATCH /org/submissions/{submissionId}`

## 7.4 Org Course Management

- List tenant courses with status and visibility context.
- Create a new course with required scheduling, description, delivery, and pricing fields.
- Open an existing course to review and edit its core details.
- Trigger publish and archive actions with clear status feedback.
- Provide navigation from course detail to the form designer for the selected course.

APIs:
- `GET /org/courses`
- `POST /org/courses`
- `GET /org/courses/{courseId}`
- `PATCH /org/courses/{courseId}`
- `POST /org/courses/{courseId}/publish`
- `POST /org/courses/{courseId}/archive`

## 7.5 Org Audit View

- List tenant audit events with filters and pagination.
- Display actor, action, resource, time, and trace IDs.

API:
- `GET /org/audit`

## 7.6 Asset Upload + Branding (MVP Admin Utility Screen)

- Request upload ticket for images.
- Upload via pre-signed URL.
- Retrieve asset metadata.
- Update tenant branding logo reference.

APIs:
- `POST /org/assets/upload-ticket`
- `GET /org/assets/{assetId}`
- `PATCH /org/branding`

## 7.7 Tenant Home and Internal Tenant Management

- Render tenant home page at `/:tenantCode` with tenant description and optional homepage content.
- Root page navigation keeps only `Home` and `Management`.
- Root page displays tenant cards that route to tenant home pages.
- Internal management screens support tenant update-only workflows (no create/delete UI).
- Frontend role handling must support `internal_admin` for internal routes.
- Frontend routing must reject reserved tenant slugs and avoid conflicts with system paths.

APIs:
- `GET /public/{tenantCode}/tenant-home` (or equivalent tenant home payload contract)
- `GET /internal/tenants`
- `PATCH /internal/tenants/{tenantId}`

## 8. UX and Design Requirements

1. Mobile-first responsive layout.
2. Fast first render for public pages.
3. Clear loading/skeleton states.
4. Actionable error messages with retry options.
5. Accessible forms and keyboard navigation.

## 9. Technical Requirements

1. Framework: React + Vite + TypeScript (recommended).
2. Data fetching: client-side fetching with reusable request/state patterns.
3. API client: typed wrappers for backend endpoints.
4. Environment config:
   - `VITE_API_BASE_URL`
5. Idempotency key generation on enrollment submit.
6. Request correlation support where useful in debug tooling.
7. Build output must be deployable as static assets to S3 behind CloudFront.

## 10. Auth Strategy (MVP)

Initial MVP can use a temporary auth shell for organization routes:

- input controls mapped to `x-user-id`, `x-tenant-id`, `x-role`
- login labels should be `Username`, `Tenant`, and `Role`
- `Tenant` dropdown includes all existing tenants plus an empty option
- `Role` is selected from supported role options (dropdown)
- `Tenant` is required for non-`internal_admin` roles and optional for `internal_admin`
- headers attached to org API calls

Later replacement path:

- Cognito hosted UI / token-based auth flow

## 11. Error Handling

- Respect backend error envelope:
  - `error.code`
  - `error.message`
  - `error.details`
  - `requestId`
  - `correlationId`
- Display user-friendly messages while preserving diagnostic details in dev mode.

## 12. Performance Targets

1. Public catalog p95 page data load under 500ms on normal network.
2. Public detail p95 page data load under 400ms.
3. Submission list interactions remain responsive with pagination.

## 13. Accessibility and Quality

1. WCAG AA baseline for color contrast and forms.
2. Inputs include labels and validation feedback.
3. Basic frontend tests for critical flows.

## 14. MVP Deliverables

1. Working public portal routes.
2. Working org course management routes.
3. Working org submission review routes.
4. Asset/branding utility UI screen.
5. Frontend smoke test checklist.
6. Deployment-ready static build configuration for S3/CloudFront.

## 15. Suggested Build Sequence

### Phase F1
- React + Vite app scaffold
- Routing and layout shell
- API client foundation

### Phase F2
- Public catalog/detail/enrollment

### Phase F3
- Org submissions list/detail/status update
- Org audit list

### Phase F4
- Asset upload and branding utility
- Polish, tests, smoke checklist, and S3/CloudFront deployment setup

### Phase F5
- Org form template designer
- Form field editing, ordering, validation, and options
- Form schema save/version workflow

### Phase F6
- Org course list page
- Org course create/edit workflow
- Publish/archive actions and status UX
- Link real course records to the form designer

### Phase F7
- Tenant-first URL model and reserved-slug guardrails
- Root home and tenant card navigation refresh
- Tenant home page and internal tenant management portal
- Role-aware frontend access for `internal_admin`
- Management login UX polish (`Management` menu label, tenant/role dropdown controls)

## 16. Open Questions

1. Should public enrollment have a dedicated success page route?
2. What branding elements must be tenant-configurable in MVP UI?
3. Should org audit view expose raw JSON details or curated fields only?
4. What minimum browser support matrix is required for demos?



