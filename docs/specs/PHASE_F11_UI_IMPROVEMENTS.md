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

- [ ] F11-01 Shared visual system and layout primitives
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/51
  Scope:
  - Add or refine shared design tokens for spacing, color, radius, typography, and status states
  - Build shared layout primitives for app shell, section header, list-detail view, drawer, status chip, and form section
  - Keep portal themes related while preserving distinct public, org, and internal personalities

- [ ] F11-02 Public portal IA, navigation, and visual refresh
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/47
  Scope:
  - Refresh public entry hierarchy across home, tenant home, catalog, and course detail
  - Improve CTA placement and shallow navigation toward enrollment
  - Strengthen tenant branding presentation, hero treatment, and visual rhythm

- [ ] F11-03 Enrollment form and success-state UX polish
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/48
  Scope:
  - Refine section rhythm, labels, validation placement, and progress cues in the public form
  - Improve closed/unavailable enrollment states
  - Strengthen success-state orientation and next actions

- [ ] F11-04 Organization portal navigation and course-first workspace refresh
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/49
  Scope:
  - Align org navigation around Dashboard, Courses, Submissions, and Settings
  - Make form-builder activity part of the course workflow instead of a separate destination
  - Improve list-detail hierarchy and status visibility across org work surfaces

- [ ] F11-05 Internal portal density and drawer UX refinement
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/50
  Scope:
  - Tighten information density and hierarchy for tenants and users
  - Improve drawer presentation, scanning, and filter ergonomics
  - Sharpen status visibility and row-to-detail transitions

- [ ] F11-06 Responsive, accessibility, and UI polish pass
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/46
  Scope:
  - Verify desktop/mobile behavior for refreshed public, org, and internal screens
  - Tighten empty/loading/error/success states across the refreshed UI
  - Validate contrast, keyboard access, and non-color-only status communication

## Primary References

- `docs/specs/FRONTEND_UI_SPEC.md`
- `docs/design/FRONTEND_VISUAL_BASELINE.md`

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
