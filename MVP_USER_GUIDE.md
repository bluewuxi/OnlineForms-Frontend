# OnlineForms Frontend MVP User Guide

Last updated: 2026-03-10

## 1) Live frontend

- Frontend base URL: `https://d1y9ka302ibufy.cloudfront.net`
- API base URL: `https://y36enrj145.execute-api.ap-southeast-2.amazonaws.com/v1`
- Region: `ap-southeast-2`

## 2) Public demo pages

Use the seeded demo tenant and course for the public browser flow:

- Home page:
  - `https://d1y9ka302ibufy.cloudfront.net/`
- Public course catalog:
  - `https://d1y9ka302ibufy.cloudfront.net/t/demo-school/courses`
- Public course detail and enrollment form:
  - `https://d1y9ka302ibufy.cloudfront.net/t/demo-school/courses/crs_demo_001`

## 3) Org portal access

The MVP org portal currently uses a temporary browser login form that stores the backend header values locally.

- Org login:
  - `https://d1y9ka302ibufy.cloudfront.net/org/login`
- Default post-login page:
  - `https://d1y9ka302ibufy.cloudfront.net/org/submissions`

Recommended demo values:

- `x-user-id`: `user_1`
- `x-tenant-id`: `ten_demo`
- `x-role`: `org_admin`

Alternative editor role:

- `x-role`: `org_editor`

## 4) What users can do

Public users can:

- browse available courses
- open a course detail page
- fill and submit the enrollment form

Org users can:

- view tenant courses once course management ships
- view the submission queue
- open a submission and mark it `reviewed` or `canceled`
- browse audit events
- upload a logo and update branding
- open the form designer for a course and save a new schema version

## 5) Suggested demo walkthrough

1. Open the public catalog and select `Project Management Essentials`.
2. Submit a test enrollment from the public course detail page.
3. Open the org login page and sign in with the demo org values above.
4. Review the submission list and open the newest submission.
5. Change the submission status to `reviewed`.
6. Open the audit page to confirm the workflow activity.
7. Open the form designer at `https://d1y9ka302ibufy.cloudfront.net/org/courses/crs_demo_001/form`.

## 6) Notes

- Deep links are supported through CloudFront SPA fallback handling.
- The org login is MVP-only and is not real authentication.
- Full org course management UI is planned next and is not live yet.
- If demo data has been reset, reseed from the backend repo with `npm run seed:sample`.
