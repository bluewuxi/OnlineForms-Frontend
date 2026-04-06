# OnlineForms Frontend Phase F12 Checklist

Source: UI layout and styling redesign — driven by user direction to rework the visual and structural foundation across all portals.

## Design Direction

The current UI uses an "editorial SaaS" pattern — large hero headlines, generous whitespace, a single long `index.css`, and a dual-navigation model (top nav + per-page OrgWorkspaceNav) in the org portal. This phase replaces it with a tighter, more product-grade layout.

### Goals

- **Smaller, more purposeful hero areas** — the current `clamp(2.5rem, 6vw, 4.5rem)` h1 dominates every page. Scale it back so content is immediately visible above the fold.
- **Sidebar shell for org and internal portals** — replace the top nav + OrgWorkspaceNav panel with a persistent left sidebar (collapses to a drawer on mobile). Remove the OrgWorkspaceNav component.
- **Cleaner design tokens** — less extreme border radius (0.75rem panels, not 1.4rem), solid button fills (no gradient), full-opacity focus outlines, and a refined spacing scale.
- **Better public course layout** — card grid with clear status, improved tenant home, management link removed from public nav.
- **No backend API changes** — all work is purely frontend layout, CSS, and component restructuring. All data shapes are consumed as-is.

### Visual Before / After Summary

| Aspect | Current | Proposed |
|--------|---------|----------|
| Hero h1 size | `clamp(2.5rem, 6vw, 4.5rem)` | `clamp(1.6rem, 3vw, 2.25rem)` |
| Panel border radius | `1.4rem` | `0.75rem` |
| Control border radius | `0.95rem` | `0.5rem` |
| Button style | Gradient fill | Solid flat fill |
| Focus outline | `rgba(36,75,127,0.35)` (semi-transparent) | `#244b7f` solid |
| Org nav pattern | Top nav + OrgWorkspaceNav per page | Fixed left sidebar |
| Public nav | Home + Management links | Home only (no management link) |
| Account menu | 2 disabled "coming soon" items + Logout | Logout only |
| Course list (org) | 7-column table | Card grid or 4-column table |

## Workflow Rule

Implement tasks strictly in order. For each task:
1. Implement feature
2. Write brief change summary in linked GitHub issue
3. Update checklist status
4. Move to next task

## Tasks

- [x] F12-01 Design token and global style foundation
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/60
  Scope:
  - Revise CSS custom properties: reduce panel radius to `0.75rem`, control radius to `0.5rem`
  - Revise h1/h2 sizing — hero h1 `clamp(1.6rem, 3vw, 2.25rem)`, line-height `1.15`, letter-spacing `-0.025em`
  - Fix button styles: replace gradient with solid `#244b7f` fill, add explicit `:hover` (darken) and `:active` states, add `:disabled` opacity
  - Fix focus outline: change to `outline: 2px solid #244b7f` at full opacity
  - Reduce shadow intensity: `--shadow-surface` lighter, `--shadow-drawer` lighter
  - Refactor `index.css` into clearly labelled sections (Tokens, Reset, Layout, Typography, Buttons, Forms, Components, Portals, Responsive)
  - Ensure all existing class names are preserved so no page regressions occur in this task

- [x] F12-02 Navigation architecture redesign
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/61
  Scope:
  - **Public header**: remove the `Management` nav link; keep brand name only (or brand + `Home` if on a nested page)
  - **Account menu**: remove disabled `Profile` and `Settings` items; keep `Logout` only
  - **Org portal shell**: introduce a persistent left sidebar (`240px` wide) with items: Courses, Submissions, Branding, Audit, Settings; sidebar replaces the top-nav links for org section
  - **Org portal**: remove `OrgWorkspaceNav` component from all org pages; repurpose or delete the component
  - **Internal portal shell**: introduce a matching left sidebar with items: Home, Tenants, Users
  - The sidebar collapses to a top drawer/hamburger on screens < 860px
  - Update `RootLayout` and `AppLayout` to support the sidebar shell for org/internal sections
  - Update `SiteHeader` for org/internal to show brand + account trigger only (nav moves to sidebar)
  Acceptance:
  - No duplicate navigation (sidebar + top nav links for same destinations)
  - Sidebar highlights the active route
  - Mobile: sidebar accessible via hamburger/drawer

- [x] F12-03 Public portal layout redesign
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/62
  Scope:
  - **HomePage**: move "How it works" editorial section below the tenant provider grid, not above it; remove the prominent management CTA section (or reduce to a discreet footer link)
  - **HomePage tenant cards**: replace raw `tenantCode` eyebrow with a generic label (e.g. "Training Provider"); tighten card min-height
  - **TenantHomePage**: reduce hero padding; better branding display (logo inline with title, not in aside card)
  - **CourseCatalogPage**: replace `tenantCode.toUpperCase()` badge with tenant `displayName` from route context or URL label; move search/filter above the grid without the redundant `section-heading` wrapper; remove redundant "Published course" eyebrow from every card; use `normalizeStatusLabel()` consistently for status display
  - **CourseDetailPage**: remove "Form version" field card (internal jargon); improve enrollment window display (replace bare `<ul>` list with a structured fact row); use `normalizeStatusLabel()` for enrollment status; format dates with `toLocaleDateString()`
  Acceptance:
  - No internal identifiers visible to public users
  - Provider directory is the first meaningful content on the home page
  - Enrollment window facts are clearly readable

- [x] F12-04 Enrollment form UX redesign
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/63
  Scope:
  - Improve field card visual treatment: cleaner card borders, less aggressive rounded corners
  - Add required-field indicator (`*`) next to required field labels
  - Improve error message placement — pin errors directly below the affected input rather than at form top
  - Improve success state: clearer confirmation heading, remove raw API payload echo
  - Improve unavailable/closed states: make them feel intentional (icon or illustration area, clear message, action link back to catalog)
  - Enrollment form submit button: full-width on mobile, left-aligned on desktop
  Acceptance:
  - Required fields are marked
  - Errors are inline, adjacent to their field
  - Success state does not show raw data

- [x] F12-05 Org course management redesign
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/64
  Scope:
  - **CoursesPage**: replace 7-column table with a card grid (2 columns on desktop, 1 on mobile); each card shows: title, short description, status chip, delivery mode, formatted date range, active form indicator, and two action buttons (Open / Form Designer); remove "Next step" as a column (move to card subtitle or tooltip)
  - **CoursesPage empty state**: replace `window.location.assign()` with React Router `useNavigate()`
  - **CourseEditorPage**: add a sticky save/action bar at the bottom of the form; tighten section spacing; improve unsaved-changes warning placement
  - **FormDesignerPage**: improve the two-panel layout — field list gets more vertical space; better visual separation between panels; "Add field" button pinned to list footer
  - Format all date range displays with `toLocaleDateString()`
  Acceptance:
  - Course list renders as cards with no table overflow
  - No full-page reload on empty-state action
  - Date strings are human-readable

- [x] F12-06 Org submissions redesign
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/65
  Scope:
  - **SubmissionsPage**: replace 4-field filter row with an inline compact filter bar (keyword/course input + status select + date pickers in a single row with a search button); improve table columns — drop verbose "Action" column, make each row itself clickable/navigable
  - **SubmissionDetailPage**: improve answer display — use a clean two-column definition list layout instead of the current stacked cards; improve the status action button placement (sticky at bottom or inline header action)
  - Reuse `StatusChip` tones consistently: submitted → info, reviewed → success, canceled → muted
  Acceptance:
  - Filter bar is compact and does not dominate the page
  - Submission rows are navigable without a separate action link column
  - Status chip tones match design system

- [x] F12-07 Internal portal layout and density refinement
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/66
  Scope:
  - With the new sidebar shell (from F12-02) in place, tighten the list-detail proportions for both `/internal/tenants` and `/internal/users`
  - Reduce padding inside `internal-users-workspace` and `internal-users-directory` panels
  - Tighten the user activity timeline card spacing
  - Improve the `internal-users-notice` banner so it sits inline with the workspace heading rather than at the top of the full workspace
  - Ensure the tenant/user filter panels align visually with the new design tokens from F12-01
  Acceptance:
  - Internal pages use the new sidebar (from F12-02) not the top nav
  - Workspace panels are visually tighter without feeling cramped
  - Activity timeline is readable and well-spaced

- [x] F12-08 Mobile and responsive pass
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/67
  Scope:
  - Verify all redesigned pages at 375px, 768px, and 1280px widths
  - Sidebar: collapses to hamburger/drawer on < 860px for org and internal portals
  - Public header: collapses gracefully; no nav link wrapping
  - Course card grid: 1 column below 600px, 2 columns 600–1024px, 3 columns above 1024px
  - Enrollment form: single-column layout on mobile
  - Submission filter bar: stacks on mobile
  - Internal list-detail: correct panel switching on mobile (directory-only vs workspace-only)
  - Fix any overflow or clipping introduced by F12-01 through F12-07
  Acceptance:
  - No horizontal scroll on any page at 375px
  - Sidebar is accessible via hamburger on mobile
  - All primary actions are reachable at mobile width

- [x] F12-09 Public portal visual refresh
  Source: Nano Banana mock screen review — 2026-04-04
  Scope:
  - **Hero**: Switch hero content from center-aligned to left-aligned across all public pages; increase headline font size significantly (`clamp(2.2rem, 5vw, 3.5rem)` range); add an outlined eyebrow badge ("BROWSE TRAINING" or tenant display name) above the headline
  - **Navbar**: Add horizontal nav links (Courses, About Us, Contact) to the public portal header; style the Login entry as a rounded pill outline button
  - **Filter panel**: Add visible label text ("Keyword search", "Enrollment Status") above each input; change the filter CTA to a filled dark primary button
  - **Course cards**: Introduce an icon-based metadata row with small inline icons for delivery mode (monitor), duration (clock), and location (pin); change the card CTA ("Review course") to an outline button style; update status pills to filled backgrounds — OPEN=green, LIMITED=amber, CLOSED=gray
  - **Footer**: Add a multi-column link footer to all public portal pages (columns: Home/Courses/Blog/Events, About/Contact, Login/Training) with a copyright line
  Acceptance:
  - Public hero is left-aligned and headline is clearly larger and bolder than body content
  - Course cards carry icon-based metadata and an outline CTA button
  - Status pills are filled and color-coded (OPEN / LIMITED / CLOSED)
  - Public navbar includes nav links and a Login pill button
  - Multi-column footer appears on all public pages
  - Layout remains responsive and collapses gracefully on mobile

- [x] F12-10 Org portal visual refresh
  Source: Nano Banana mock screen review — 2026-04-04
  Scope:
  - **Navbar**: Enrich the org portal top navbar — add a centered global search bar, a notification bell icon with an unread badge dot, and a user avatar thumbnail with display name and dropdown caret on the right; retain the logout button
  - **Hero banner**: Replace the current org hero with a full-width dark navy banner; content is left-aligned with a circular workspace badge graphic, a large white headline, and a lighter subtitle; add an inline help link next to the subtitle
  - **Workflow nav cards**: Add a small icon to each workflow nav card (list icon for "Course list", plus icon for "Create course", gear icon for "Settings"); apply an active-state treatment to the current card — colored left border and a small "Active" badge at the top-right corner
  - **Table status pills**: Refine all table status pills to use filled backgrounds — DRAFT=amber, PUBLISHED=green, ARCHIVED=gray — with appropriate contrast text; no outline-only pills
  - **Table action buttons**: Apply two distinct visual weights to the Actions column — "Open details" as a blue outline button, "Form designer" as a ghost/teal outline button
  - **Activity feed sidebar**: Add a right-side contextual activity feed panel to the org course list page; each item shows a small avatar thumbnail, a short message (e.g. "Course X needs review"), and a relative timestamp; the sidebar is scrollable and blends with the page background
  Acceptance:
  - Org navbar shows search bar, notification bell, and user identity
  - Org hero is a dark navy full-width banner with left-aligned white content and circular workspace badge
  - Workflow nav cards have icons and a clear active state (colored border + "Active" badge)
  - Table status pills are filled and color-correct for all three states
  - Table action buttons are visually differentiated by intent
  - Activity sidebar is visible on the org course list page
  - Layout remains functional on tablet widths; sidebar collapses on mobile

## Primary References

- `docs/specs/FRONTEND_UI_SPEC.md`
- `docs/design/FRONTEND_VISUAL_BASELINE.md`
- `docs/specs/PHASE_F11_UI_IMPROVEMENTS.md` (completed — do not regress)

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed
