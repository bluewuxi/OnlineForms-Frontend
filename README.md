# OnlineForms Frontend

Frontend web application for the OnlineForms MVP SaaS.
See OnlineForms Repository for backend repository

OnlineForms is a multi-tenant SaaS application for education and training providers to publish courses, collect online enrollments through configurable forms, review submissions, and manage operations across public, tenant, and internal admin portals.

It was built as an AI-first engineering project to demonstrate how production-style software can be created through structured human + AI collaboration. The entire codebase was generated with Codex through an iterative workflow of requirement shaping, design and engineering review, implementation, bug fixing, code review, shipping, deployment verification, and documentation updates. The work was informed by prior real production experience, so the project reflects practical SaaS architecture, admin workflows, authentication patterns, and CI/CD practices rather than a toy prototype.

## Purpose

This repository contains the customer-facing and organization-facing UI for OnlineForms, including:

- Public course catalog and course detail pages
- Public enrollment form experience
- Organization portal views (submissions and review workflow)
- Internal portal control-plane screens for tenant and user administration

## Backend Integration

The frontend integrates with the OnlineForms backend API:

- Frontend URL (deployed): `https://form.kidrawer.com`
- API base URL (deployed): `https://form-api.kidrawer.com/v1`
- Backend repository: `bluewuxi/OnlineForms`

## Project Docs

- MVP spec: `docs/specs/FRONTEND_MVP_SPEC.md`
- UI spec: `docs/specs/FRONTEND_UI_SPEC.md`
- Implementation checklist: `docs/specs/FRONTEND_IMPLEMENTATION_CHECKLIST.md`
- Phase F11 UI improvements: `docs/specs/PHASE_F11_UI_IMPROVEMENTS.md`
- Bug management process: `docs/process/bug-management.md`
- Bug investigation runbook: `docs/guides/BUG_RUNBOOK.md`
- Visual baseline: `docs/design/FRONTEND_VISUAL_BASELINE.md`
- Smoke checklist: `docs/ops/FRONTEND_SMOKE_CHECKLIST.md`
- S3/CloudFront deployment notes: `docs/ops/S3_CLOUDFRONT_DEPLOYMENT.md`
- Frontend user guide: `MVP_USER_GUIDE.md`

## MVP Scope (Initial)

1. Public pages:
   - Course catalog
   - Course detail
   - Enrollment form submit flow
2. Org pages:
   - Login shell
   - Submission list
   - Submission detail and status update

## Routing Guardrails

- Tenant routes use `/{tenantCode}` and `/{tenantCode}/courses`.
- Reserved slugs are blocked from tenant resolution (for example: `org`, `internal`, `api`, `admin`, `health`, `courses`, `public`, `t`, `v1`).
- Legacy `/t/{tenantCode}/...` URLs redirect to tenant-first routes.

## Local Scripts

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run preview`

## Environment

- Copy `.env.example` to `.env.local` for local development overrides.
- `VITE_API_BASE_URL` defaults to the deployed MVP API if not provided.
- `VITE_PUBLIC_TENANT_CODES` (comma-separated) provides fallback tenant cards on home page when `/public/tenants` is unavailable.
- `VITE_AUTH_MODE` supports `mock` or `cognito`.
  - default behavior when unset: `mock` on localhost, `cognito` on non-local hosts
- If `VITE_AUTH_MODE=cognito`, set:
  - `VITE_COGNITO_DOMAIN`
  - `VITE_COGNITO_CLIENT_ID`
  - `VITE_COGNITO_REDIRECT_URI`
  - `VITE_COGNITO_SCOPE` (optional, default `openid profile email`)
  - `VITE_COGNITO_TOKEN_USE` (`access` default, set `id` only if backend verifier is configured for ID tokens)

## Login Flow

- In Cognito mode, login uses Hosted UI (`Continue with Cognito`).
- After callback, user selects one tenant and one role from allowed memberships.
- Frontend validates selected context through backend endpoints:
  - `GET /v1/org/session-contexts`
  - `POST /v1/org/session-context`
- If the authenticated identity has internal capability, the login shell exposes an `Internal Management` path that validates context before entering the internal portal.

## Internal Portal Status

The internal portal is no longer limited to tenant editing. It now includes an internal-users access-control console with:

- searchable operator directory
- selected-user workspace
- create user with initial password and temporary-password option
- activate / deactivate actions
- add / remove internal-admin access
- password reset confirmation flow
- read-only tenant membership context
- per-user activity timeline for login, logout, status, role, and credential events

## Foundation Stack

- React 19
- Vite 7
- TypeScript 5
- React Router
- TanStack Query
- React Hook Form
- Vitest + Testing Library

## Status

- React + Vite + TypeScript frontend deployed on S3/CloudFront
- MVP docs and implementation checklist committed
- Phase F11 UI-improvement planning committed
- Target stack: React + Vite on S3/CloudFront
- Phases F1-F5 implemented


