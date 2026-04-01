# OnlineForms Frontend Phase F11 Checklist

Source: UI design and navigation improvement plan

## Workflow Rule

Implement tasks strictly in order. For each task:
1. Implement feature
2. Write brief change summary in linked GitHub issue
3. Update checklist status
4. Move to next task

Phase F11 is dedicated to frontend navigation, layout, and visual refinement work across the public, organization, and internal portals.

## Tasks

- [x] F11-01 Shared visual system and layout primitives
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/51
  Scope:
  - Add or refine shared design tokens for spacing, color, radius, typography, and status states
  - Build shared layout primitives for app shell, section header, list-detail view, drawer, status chip, and form section
  - Keep portal themes related while preserving distinct public, org, and internal personalities
  Delivered:
  - Added shared CSS tokens for color, spacing, radius, and surface shadows
  - Added shared primitives for `SectionHeader`, `ListDetailLayout`, `StatusChip`, and `FormSection`
  - Applied the new primitives to representative org/internal work surfaces to establish the shared system

- [ ] F11-02 Public portal IA, navigation, and visual refresh
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/47
  Scope:
  - Rework `/` so the primary message is about browsing training providers and courses rather than demo routes
  - Improve tenant-card hierarchy and CTA clarity on the home page
  - Improve `/:tenantCode` so branding, description, and homepage content feel like a real tenant landing page
  - Tighten `/:tenantCode/courses` hierarchy, filter placement, and course-card CTA/status balance
  - Tighten `/:tenantCode/courses/:courseId` top-of-page hierarchy for summary, key facts, and enrollment entry
  - Keep public navigation shallow and enrollment-oriented without backend contract changes
  Acceptance focus:
  - Home page no longer leads with internal/demo framing
  - Tenant home feels like a real landing page
  - Catalog and course detail hierarchy is clearer without changing route structure or API behavior

- [ ] F11-03 Enrollment form and success-state UX polish
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/48
  Scope:
  - Improve form field rhythm, labels, help text, and required-field treatment
  - Improve validation UX so errors are more intentional and stay close to the affected field
  - Improve unavailable-form, closed-enrollment, and request-failure states
  - Strengthen success-state orientation, copy, and action ordering using backend-returned links
  - Keep the flow calm, trustworthy, and mobile-friendly without changing schema-driven rendering
  Acceptance focus:
  - Form is easier to scan and complete
  - Non-happy-path states feel deliberate rather than raw
  - Success state feels like a real completion surface rather than a payload echo

- [ ] F11-04 Organization portal navigation and course-first workspace refresh
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/49
  Scope:
  - Rework org navigation around a clearer information architecture centered on `Courses`, `Submissions`, and `Settings`
  - Decide and implement whether `Audit` and `Branding` remain direct nav items or move under settings-level organization
  - Make course list, course editor, form designer, and publish/archive actions feel like one connected workflow
  - Improve course-list hierarchy for readiness, status, and visibility scanning
  - Improve course-editor hierarchy for status, save state, and next-step actions
  - Keep submissions aligned with the org visual language without redoing the submission flow unnecessarily
  Acceptance focus:
  - Org nav is more intentional than the current MVP carryover
  - Course authoring feels connected end to end
  - Status and publish/archive actions are easier to understand at a glance

- [ ] F11-05 Internal portal density and drawer UX refinement
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/50
  Scope:
  - Tighten information density and hierarchy for tenants and users
  - Improve drawer presentation, scanning, and filter ergonomics
  - Sharpen status visibility and row-to-detail transitions

- [ ] F11-06 Responsive, accessibility, and UI polish pass
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/46
  Scope:
  - Treat this as the final cross-portal QA/polish pass after F11-02, F11-03, and F11-04
  - Verify desktop and narrow-screen behavior for:
    - `/`
    - `/:tenantCode`
    - `/:tenantCode/courses`
    - `/:tenantCode/courses/:courseId`
    - `/org/login`
    - `/org/courses`
    - `/org/courses/:courseId`
    - `/org/submissions`
    - `/org/submissions/:submissionId`
    - `/internal/tenants`
    - `/internal/users`
  - Check keyboard navigation, focus treatment, dialogs, filters, and primary forms
  - Tighten remaining low-quality loading/empty/error/success states
  - Validate contrast and non-color-only status communication
  - Update smoke guidance/screenshots if the UI changed materially
  Acceptance focus:
  - Key screens remain usable at desktop and mobile widths
  - Keyboard and focus behavior is solid across important flows
  - Remaining placeholder-feeling state treatments are cleaned up

## Primary References

- `docs/specs/FRONTEND_UI_SPEC.md`
- `docs/design/FRONTEND_VISUAL_BASELINE.md`

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
