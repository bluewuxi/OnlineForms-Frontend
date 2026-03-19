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

- [ ] F7-01 Route model update for tenant-first URLs and reserved slug handling (#22)
- [ ] F7-02 Root home IA refresh and tenant card navigation (#23)
- [ ] F7-03 Tenant home page and course-list CTA (#24)
- [ ] F7-04 Internal tenant management screens (update-only) (#25)
- [ ] F7-05 Internal management role-aware access control (#26)
- [ ] F7-06 Reserved slug guardrails, QA, and docs (#27)
