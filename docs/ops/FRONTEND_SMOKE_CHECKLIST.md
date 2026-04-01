# Frontend Smoke Checklist

Date created: 2026-03-10
Repository: bluewuxi/OnlineForms-Frontend

## Purpose

Provide a quick manual verification flow for the current frontend before demos and releases.

## Preconditions

- Cognito app client and Hosted UI are configured for this environment
- `VITE_API_BASE_URL` points to the deployed backend
- Frontend is running locally or deployed in a target environment

## Public Portal

1. Open `/`
2. Confirm the landing page renders provider-focused messaging and links to both public browsing and management
3. Open `/:tenantCode`
4. Confirm tenant branding renders and rich-text description/home content display safely
5. Open `/:tenantCode/courses`
6. Confirm course catalog data loads without console errors
7. Enter a search term and confirm the URL updates with `q=...`
8. Apply a status filter and confirm the list updates cleanly
9. Open a course detail page from the catalog
10. Confirm course detail content and enrollment form fields render with clear hierarchy
11. Submit a valid enrollment form
12. Confirm the success state shows a submission ID, status, and follow-up actions

## Org Portal

1. Open `/org/login`
2. Click `Continue with Cognito` and complete Hosted UI sign-in
3. Confirm redirect lands on role-appropriate destination:
   - internal role -> `/internal/tenants`
   - org role -> `/org/courses` (or valid org returnTo)
4. Open `/org/courses`
5. Confirm the workflow header, course readiness columns, and course actions render
6. Open one course detail page and then `/org/courses/:courseId/form`
7. Confirm the course editor and form designer read as one connected workflow
8. Open `/org/settings`
9. Confirm `Branding` and `Audit` are reachable from settings navigation
10. Open `/org/submissions`
11. Confirm submissions load and filters work
12. Open one submission detail page
13. Attempt a valid status transition from `submitted` to `reviewed` or `canceled`
14. Confirm optimistic UI feedback is followed by the final saved state
15. Open `/org/audit`
16. Confirm audit events load and request/correlation IDs are visible
17. Open `/org/branding`
18. Upload a valid image and confirm asset metadata is returned
19. Apply the uploaded asset as the org logo and confirm the success state
20. Trigger token-expiry scenario (or wait for short-lived token env) and confirm:
    - API request auto-recovers via refresh
    - if refresh fails, user is redirected back to `/org/login`

## Internal Portal

1. Open `/internal/tenants`
2. Confirm tenant directory summary, search, and status filter render
3. Select a tenant and confirm the detail drawer shows status plus HTML content editors with preview mode
4. Create a test tenant and confirm the drawer returns to edit mode on success
5. Open `/internal/users`
6. Confirm user directory summary, search, and status filter render
7. Open one internal user and confirm activity, tenant visibility, and immediate actions render
8. Trigger password reset, confirm the dialog is keyboard dismissible with `Escape`, then reopen and complete the action
9. Open the account menu in the header and confirm `Escape` closes it while keeping focus on the trigger

## Accessibility Spot Checks

1. Navigate key forms, filters, and header menus using keyboard only
2. Confirm visible focus states on links, buttons, inputs, and dialog actions
3. Confirm labels are present for form fields and search controls
4. Confirm status, errors, and activity states remain readable at normal zoom and are not communicated by color alone
5. At narrow width, confirm public, org, and internal list/detail pages remain usable without clipped actions

## Release Gate

Smoke passes when:

- No blocking console errors appear during core flows
- Public enrollment succeeds
- Org course, submission, audit, and branding workflows succeed
- Internal tenant and internal user management surfaces load and remain operable
- Cognito login/refresh/sign-out flows behave as expected
