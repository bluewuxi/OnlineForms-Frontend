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
  - Lightweight entry page linking to the public and org experiences.
- Key sections:
  - Product intro
  - Public portal entry CTA
  - Org portal entry CTA
- Actions:
  - Navigate to tenant public catalog
  - Navigate to org login
- States:
  - Static page, no data load required

## 4.2 Public Course Catalog

- Route: `/t/:tenantCode/courses`
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

## 4.3 Public Course Detail

- Route: `/t/:tenantCode/courses/:courseId`
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

## 4.4 Org Login Shell

- Route: `/org/login`
- Purpose:
  - Capture MVP header-based org session fields before protected route usage.
- Fields:
  - `x-user-id`
  - `x-tenant-id`
  - `x-role`
- Key sections:
  - Short explanation that this is an MVP auth shell
  - Session form
  - Continue action
- Behavior:
  - Persist values locally for later org API requests
  - Redirect to org submissions after successful save
- States:
  - Inline validation for missing required values

## 4.5 Org Submissions List

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

## 4.6 Org Submission Detail

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

## 4.7 Org Audit View

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

## 4.8 Asset Upload and Branding Utility

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

## 5. Navigation Model

- Public area:
  - Simple top bar with brand/title and optional catalog context.
- Org area:
  - Compact nav linking to submissions, audit, and branding utility.
- Protected org routes:
  - Redirect to `/org/login` when MVP session values are missing.

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

## 8. Acceptance Focus

Implementation should be considered aligned with this UI spec when:

1. Every MVP route has a defined purpose, structure, and state model.
2. Data-driven views have loading, empty, and error states.
3. Public and org experiences share consistent UI patterns.
4. The UI stays usable on mobile-width screens.
5. The app remains directly aligned to the current backend API surface.
