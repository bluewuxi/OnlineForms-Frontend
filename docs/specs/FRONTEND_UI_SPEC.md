# OnlineForms Frontend UI Spec

Version: 0.1 (Draft)
Date: 2026-03-10
Repository: bluewuxi/OnlineForms-Frontend
Related docs:
- `docs/specs/FRONTEND_MVP_SPEC.md`
- `docs/specs/FRONTEND_IMPLEMENTATION_CHECKLIST.md`

## 1. Purpose

Define the initial UI and interaction behavior for the OnlineForms MVP frontend so implementation can proceed with clear page structure, states, and API integration expectations.

## 2. UI Principles

1. Prioritize fast task completion over visual complexity.
2. Keep the public experience clean, friendly, and mobile-first.
3. Keep the org experience dense enough for operational review without feeling cluttered.
4. Make loading, empty, and error states explicit on every data-driven page.
5. Reuse shared patterns for page headers, cards, tables, filters, and status messaging.

## 3. Shared App Structure

### 3.1 Global Layout

- Top-level app frame with route content area and shared notification region.
- Responsive container widths with comfortable mobile spacing.
- Shared page title and subtitle pattern.
- Shared inline alert area for recoverable errors and action confirmations.

### 3.2 Shared UI Patterns

- Loading:
  - Skeleton blocks for lists and page sections.
  - Disabled button state during in-flight actions.
- Empty:
  - Short explanation plus one clear next action where appropriate.
- Error:
  - User-friendly message.
  - Retry action for reloadable data fetches.
  - Optional debug details in development mode only.
- Status:
  - Consistent badge treatment for submission and enrollment-related states.

## 4. Routes and Screens

## 4.1 Landing Page

- Route: `/`
- Purpose:
  - Lightweight entry page linking to tenant experiences and the internal management portal.
- Key sections:
  - Product intro
  - Tenant cards
  - Management CTA
- Actions:
  - Navigate to tenant home page (`/:tenantCode`)
  - Navigate to management portal
- States:
  - Loading state while tenant cards are fetched
  - Empty state when no active tenants are available

## 4.2 Tenant Home Page

- Route: `/:tenantCode`
- API:
  - Tenant home payload endpoint from backend public API
- Purpose:
  - Provide tenant overview and entry point to published courses.
- Key sections:
  - Tenant title/branding
  - Tenant description
  - Optional tenant home-page content
  - CTA to `/:tenantCode/courses`
- States:
  - Loading content skeleton
  - Tenant not found/inactive state
  - Error state with retry

## 4.3 Public Course Catalog

- Route: `/:tenantCode/courses`
- API:
  - `GET /public/{tenantCode}/courses`
- Purpose:
  - Help anonymous users browse available courses for a tenant.
- Key sections:
  - Page header with tenant/context title
  - Search input for `q`
  - Course result list
  - Pagination or load-more controls using cursor data
- Each course card should show:
  - Course title
  - Short summary
  - Enrollment availability indicator
  - Primary action to open detail page
- States:
  - Loading skeleton for search and course list
  - Empty state when no results exist
  - Error state with retry
- Mobile notes:
  - Search and result cards stack vertically
  - Actions remain thumb-friendly

## 4.4 Public Course Detail

- Route: `/:tenantCode/courses/:courseId`
- API:
  - `GET /public/{tenantCode}/courses/{courseId}`
- Purpose:
  - Present course details and host the enrollment form.
- Key sections:
  - Back link to catalog
  - Course headline area
  - Course detail summary/content
  - Enrollment window status
  - Enrollment form panel
- Enrollment form behavior:
  - Render fields from current backend-driven schema assumptions
  - Show inline validation feedback
  - Disable submit while the request is in flight
- States:
  - Loading skeleton for headline and form area
  - Closed/unavailable enrollment state
  - Submission success state
  - Submission error state with retry guidance

## 4.5 Org Login Shell

- Route: `/org/login`
- Purpose:
  - Capture MVP header-based org session fields before protected route usage.
- Fields:
  - `Username` (`x-user-id`)
  - `Tenant` (`x-tenant-id`) via dropdown populated with existing tenants plus an empty option
  - `Role` (`x-role`) via dropdown of supported roles
- Key sections:
  - Short explanation that this is an MVP auth shell
  - Session form
  - Continue action
- Behavior:
  - Persist values locally for later org API requests
  - Redirect to org submissions after successful save
  - `Tenant` is compulsory for non-`internal_admin` roles and optional when role is `internal_admin`
  - `Management` entry (`/management`) initiates Hosted UI login directly in Cognito mode when unauthenticated
  - In Cognito post-auth context, show `Internal Management` shortcut only when token capability includes internal access
  - Callback/context failures render operator-facing diagnostics with recovery guidance
  - Internal-access diagnostics explain missing `internal_admin` claim/group and no-membership scenarios
  - Cognito post-auth context includes account-switch controls (`Retry sign-in` / `Use different account`)
- States:
  - Inline validation for missing required values

## 4.6 Org Submissions List

- Route: `/org/submissions`
- API:
  - `GET /org/submissions`
- Purpose:
  - Let org users review the current submission queue.
- Key sections:
  - Page header
  - Filter bar for course, status, and date range
  - Submission results table or stacked cards on small screens
  - Cursor-based pagination controls
- Each row or card should show:
  - Applicant name or primary identifier
  - Course
  - Current status
  - Submitted time
  - Action to open detail
- States:
  - Loading table skeleton
  - Empty filtered results state
  - Error state with retry

## 4.7 Org Course List

- Route: `/org/courses`
- API:
  - `GET /org/courses`
- Purpose:
  - Let org users browse and manage tenant courses before moving into publishing, submissions, or form design tasks.
- Key sections:
  - Page header
  - Primary action to create a course
  - Course list or table with status and visibility indicators
  - Actions to open detail/edit and form designer
- Each row or card should show:
  - Course title
  - Delivery mode
  - Schedule summary
  - Status
  - Public visibility
- States:
  - Loading list skeleton
  - Empty state when no courses exist yet
  - Error state with retry

## 4.8 Org Course Detail and Edit

- Routes:
  - `/org/courses/new`
  - `/org/courses/:courseId`
- APIs:
  - `POST /org/courses`
  - `GET /org/courses/{courseId}`
  - `PATCH /org/courses/{courseId}`
  - `POST /org/courses/{courseId}/publish`
  - `POST /org/courses/{courseId}/archive`
- Purpose:
  - Allow org users to create new courses, edit existing ones, and control publish/archive workflow.
- Key sections:
  - Course summary header
  - Editable metadata form
  - Scheduling and enrollment dates
  - Delivery and pricing fields
  - Status action panel
  - Link to form designer for the selected course
- Behavior:
  - Use one form for create and edit with clear draft/save states
  - Show publish/archive confirmations and backend conflict errors cleanly
  - Keep navigation back to the course list obvious
- States:
  - Loading detail skeleton
  - Create success and update success feedback
  - Publish/archive success and error feedback
  - Validation errors inline on required fields

## 4.9 Org Submission Detail

- Route: `/org/submissions/:submissionId`
- API:
  - `GET /org/submissions/{submissionId}`
  - `PATCH /org/submissions/{submissionId}`
- Purpose:
  - Let org users inspect one submission and update its workflow status.
- Key sections:
  - Submission summary header
  - Applicant details
  - Submitted form responses
  - Status action panel
- Actions:
  - Mark as `reviewed`
  - Mark as `canceled`
- Behavior:
  - Show optimistic update feedback carefully
  - Recover cleanly when backend rejects a stale transition
- States:
  - Loading detail skeleton
  - Action success toast or inline confirmation
  - Action error banner with current backend state if available

## 4.10 Org Audit View

- Route: `/org/audit`
- API:
  - `GET /org/audit`
- Purpose:
  - Provide a simple operational view of tenant audit activity.
- Key sections:
  - Page header
  - Filter controls
  - Audit event list or table
- Each event item should show:
  - Time
  - Actor
  - Action
  - Resource
  - Request ID
  - Correlation or trace ID when present
- States:
  - Loading list skeleton
  - Empty state for no matching events
  - Error state with retry

## 4.11 Asset Upload and Branding Utility

- Route:
  - Final route to be decided during implementation, under org area
- APIs:
  - `POST /org/assets/upload-ticket`
  - `GET /org/assets/{assetId}`
  - `PATCH /org/branding`
- Purpose:
  - Support MVP demo administration for logo upload and branding update.
- Key sections:
  - Current branding preview
  - File picker and upload action
  - Upload progress or step indicator
  - Branding update form or confirmation action
- Behavior:
  - Validate file type before upload when possible
  - Show upload progress/message states
  - Refresh displayed asset metadata after upload
- States:
  - Idle
  - Uploading
  - Upload success
- Upload failure with retry guidance

## 4.12 Org Form Template Designer

- Route:
  - Final route to be decided during implementation, likely under `/org/courses/:courseId/form`
- APIs:
  - `GET /org/courses/{courseId}/form-schema`
  - `PUT /org/courses/{courseId}/form-schema`
- Purpose:
  - Allow org users to design and revise the enrollment form template for a course.
- Key sections:
  - Form schema summary header
  - Field list with display order
  - Field editor panel
  - Validation and options controls
  - Save/version action area
- Behavior:
  - Support adding, editing, removing, and reordering fields
  - Support field-specific validation and option editing
  - Keep version/save behavior clear to org users
- States:
  - Loading schema
  - Empty form state before fields exist
  - Unsaved changes state
  - Save success and save error feedback

## 4.13 Internal Tenant Management

- Route:
  - `/internal/tenants`
- APIs:
  - `GET /internal/tenants`
  - `PATCH /internal/tenants/{tenantId}`
- Purpose:
  - Let internal operators update tenant profile information without create/delete actions.
- Key sections:
  - Tenant list with search/filter
  - Tenant profile edit form (`description`, `isActive`, `homePageContent`)
  - Save result feedback
- Behavior:
  - Restrict page access to `internal_admin` (or higher privileged internal roles)
  - Validate and block reserved tenant-code values in edit flow
  - Provide clear validation messages from backend
- States:
  - Loading list/form states
  - Save success/error feedback
  - Unauthorized access state

## 4.14 Internal Users Access Control Console

- Route:
  - `/internal/users`
- APIs:
  - `GET /internal/users`
  - `GET /internal/users/{userId}`
  - `POST /internal/users`
  - `POST /internal/users/{userId}/activate`
  - `POST /internal/users/{userId}/deactivate`
  - `POST /internal/users/{userId}/roles/add`
  - `POST /internal/users/{userId}/roles/remove`
  - `POST /internal/users/{userId}/password-reset`
  - `GET /internal/users/{userId}/activity`
  - `POST /internal/users/activity/logout`
- Purpose:
  - Let internal operators manage platform-user lifecycle from a professional access-control console rather than a basic CRUD drawer.
- Key sections:
  - searchable user directory rail
  - selected-user summary
  - internal access actions
  - credentials section with reset confirmation
  - read-only tenant memberships
  - activity timeline
- Create-user flow:
  - email
  - preferred name
  - initial password
  - temporary-password option
  - enabled-on-create toggle
  - day-one role assignment for `internal_admin`
- Behavior:
  - selecting a user loads detail and activity separately
  - status and role changes act immediately with inline feedback
  - password reset requires confirmation before mutation
  - narrow screens switch between directory mode and workspace mode
  - login and logout events should appear in the activity timeline when auth flow succeeds
- States:
  - loading directory
  - loading selected-user detail
  - loading activity
  - no internal users yet
  - no activity yet
  - activity source unavailable
  - mutation success / mutation failure
  - blocked guardrail state for self-lockout / last-operator protection

## 5. Navigation Model

- Public area:
  - Top menu includes only `Home`; tenant navigation is card and page-CTA based.
- Org area:
  - Compact nav linking to courses, submissions, audit, branding utility, and form designer where appropriate.
- Protected org routes:
  - Redirect to `/org/login` when MVP session values are missing.
- Internal area:
  - Dedicated nav entry from home for `Management`.
  - Internal operational pages include `Tenants` and `Users`.
  - Reserved slugs (`org`, `internal`, `api`, `admin`, `health`, `courses`) cannot resolve as tenant pages.

## 6. API-to-UI Notes

- Public catalog:
  - Preserve query string values in the URL for search and pagination continuity.
- Enrollment submission:
  - Generate an idempotency key on each deliberate submit attempt.
- Org requests:
  - Attach MVP auth headers from stored session values.
- Error handling:
  - Map backend `error.message` to the main user-facing message.
  - Surface `requestId` or `correlationId` in development-facing detail areas.

## 7. Initial Component Targets

- App shell
- Page header
- Inline alert
- Status badge
- Search bar
- Filter bar
- Course card
- Data table
- Empty state panel
- Error state panel
- Form field renderer
- Submission detail section
- Internal user directory item
- Internal activity timeline row
- Internal password-reset confirmation modal

## 8. Acceptance Focus

Implementation should be considered aligned with this UI spec when:

1. Every MVP route has a defined purpose, structure, and state model.
2. Data-driven views have loading, empty, and error states.
3. Public and org experiences share consistent UI patterns.
4. The UI stays usable on mobile-width screens.
5. The app remains directly aligned to the current backend API surface.
6. Internal portal user management behaves like an access-control workspace, not a single-form admin page.

