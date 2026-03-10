# OnlineForms Frontend

Frontend web application for the OnlineForms MVP SaaS.

## Purpose

This repository contains the customer-facing and organization-facing UI for OnlineForms, including:

- Public course catalog and course detail pages
- Public enrollment form experience
- Organization portal views (submissions and review workflow)

## Backend Integration

The frontend integrates with the OnlineForms backend API:

- API base URL (deployed): `https://y36enrj145.execute-api.ap-southeast-2.amazonaws.com/v1`
- Backend repository: `bluewuxi/OnlineForms`

## Project Docs

- MVP spec: `docs/specs/FRONTEND_MVP_SPEC.md`
- UI spec: `docs/specs/FRONTEND_UI_SPEC.md`
- Implementation checklist: `docs/specs/FRONTEND_IMPLEMENTATION_CHECKLIST.md`
- Visual baseline: `docs/design/FRONTEND_VISUAL_BASELINE.md`

## MVP Scope (Initial)

1. Public pages:
   - Course catalog
   - Course detail
   - Enrollment form submit flow
2. Org pages:
   - Login shell
   - Submission list
   - Submission detail and status update

## Suggested Next Steps

1. Initialize frontend framework (recommended: React + Vite + TypeScript)
2. Add typed API client aligned to the current backend contract
3. Implement Phase 1 public pages and enrollment flow
4. Implement Phase 2 org submission review screens
5. Configure static deployment to S3 + CloudFront

## Status

- Repository scaffold created
- README initialized
- MVP spec and implementation checklist committed
- Target stack: React + Vite on S3/CloudFront
- Implementation pending
