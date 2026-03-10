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
- Smoke checklist: `docs/ops/FRONTEND_SMOKE_CHECKLIST.md`
- S3/CloudFront deployment notes: `docs/ops/S3_CLOUDFRONT_DEPLOYMENT.md`

## MVP Scope (Initial)

1. Public pages:
   - Course catalog
   - Course detail
   - Enrollment form submit flow
2. Org pages:
   - Login shell
   - Submission list
   - Submission detail and status update

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

## Foundation Stack

- React 19
- Vite 7
- TypeScript 5
- React Router
- TanStack Query
- React Hook Form
- Vitest + Testing Library

## Status

- React + Vite + TypeScript scaffold created
- MVP spec and implementation checklist committed
- Target stack: React + Vite on S3/CloudFront
- Phases F1-F3 implemented
- Phase F4 in progress
