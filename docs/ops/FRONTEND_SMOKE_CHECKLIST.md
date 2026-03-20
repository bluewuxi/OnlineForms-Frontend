# Frontend Smoke Checklist

Date created: 2026-03-10
Repository: bluewuxi/OnlineForms-Frontend

## Purpose

Provide a quick manual verification flow for the MVP frontend before demos and releases.

## Preconditions

- Cognito app client and Hosted UI are configured for this environment
- `VITE_API_BASE_URL` points to the deployed backend
- Frontend is running locally or deployed in a target environment

## Public Portal

1. Open `/`
2. Confirm the landing page renders and links to the public catalog and org portal
3. Open `/acme-training/courses`
4. Confirm course catalog data loads without console errors
5. Enter a search term and confirm the URL updates with `q=...`
6. Apply a status filter and confirm the list updates cleanly
7. Open a course detail page from the catalog
8. Confirm course detail content and enrollment form fields render
9. Submit a valid enrollment form
10. Confirm the success state shows a submission ID and status

## Org Portal

1. Open `/org/login`
2. Click `Continue with Cognito` and complete Hosted UI sign-in
3. Confirm redirect lands on role-appropriate destination:
   - internal role -> `/internal/tenants`
   - org role -> `/org/submissions` (or valid org returnTo)
4. Open `/org/submissions`
5. Confirm submissions load and filters work
6. Open one submission detail page
7. Attempt a valid status transition from `submitted` to `reviewed` or `canceled`
8. Confirm optimistic UI feedback is followed by the final saved state
9. Open `/org/audit`
10. Confirm audit events load and request/correlation IDs are visible
11. Open `/org/branding`
12. Upload a valid image and confirm asset metadata is returned
13. Apply the uploaded asset as the org logo and confirm the success state
14. Trigger token-expiry scenario (or wait for short-lived token env) and confirm:
    - API request auto-recovers via refresh
    - if refresh fails, user is redirected back to `/org/login`

## Accessibility Spot Checks

1. Navigate key forms using keyboard only
2. Confirm visible focus states on links, buttons, and inputs
3. Confirm labels are present for form fields
4. Confirm status and error text remain readable at normal zoom

## Release Gate

Smoke passes when:

- No blocking console errors appear during core flows
- Public enrollment succeeds
- Org review actions succeed
- Audit and branding utilities load successfully
- Cognito login/refresh/sign-out flows behave as expected
