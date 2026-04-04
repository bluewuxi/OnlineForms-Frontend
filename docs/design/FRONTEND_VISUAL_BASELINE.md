# OnlineForms Frontend Visual Baseline

Version: 0.3
Date: 2026-04-04
Repository: bluewuxi/OnlineForms-Frontend
Reference:
- MVP example layout provided in thread on 2026-03-10
- Nano Banana mock screens reviewed on 2026-04-04 (Org Course Management + Public Course Catalog)
- `docs/specs/FRONTEND_UI_SPEC.md`

---

## 1. Purpose

Define the visual direction for the OnlineForms MVP frontend so generated mockups, implementation work, and later design refinements all start from the same styling baseline.

This document was updated in v0.3 to incorporate lessons from the Nano Banana mock screens reviewed on 2026-04-04. Those mocks revealed specific improvements over the earlier v0.1 baseline — particularly around hero layout, navbar richness, card metadata, workflow nav affordance, and org portal activity awareness.

---

## 2. Design Intent

The MVP should feel:

- modern
- trustworthy
- calm
- professional
- simple to use

The visual tone should support a SaaS product demo without feeling too corporate, too playful, or overly decorative.

**Portal-level distinction:**
- Public pages lean slightly more open and promotional — more whitespace, larger hero typography, marketing-style navbar
- Org pages are slightly denser and task-oriented — structured dashboard layout, clear action buttons, activity context

---

## 3. Reference Pages

### 3.1 Public Course Catalog (primary visual reference for public portal)

Key elements from the approved mock:
- Full-width hero with left-aligned headline, "BROWSE TRAINING" badge, multi-line description
- Horizontal filter panel (keyword + enrollment status dropdown + CTA) as a floating white card
- Course card grid (3 columns desktop) with icon-based metadata row
- Status badges (OPEN / LIMITED / CLOSED) + outline "Review course" button per card
- Centered "Load more" button + count label at page bottom
- Marketing-style navbar (logo, nav links, Login pill button)
- Multi-column footer

### 3.2 Org Course Management (primary visual reference for org portal)

Key elements from the approved mock:
- Persistent top navbar: logo + workspace name, centered global search bar, notification bell (with badge), user avatar + display name, logout button
- Full-width dark navy hero banner, left-aligned: circular workspace badge, large white headline, subtitle
- Three-card workflow nav strip: icon + title + description per card; active card has colored left border + "Active" badge
- Right-side activity feed sidebar: avatar, message, relative timestamp per item
- Course data table: white rows, subtle borders, two visually distinct action buttons per row
- Status pills: DRAFT (amber), PUBLISHED (green), ARCHIVED (gray) — all filled

---

## 4. Visual Characteristics

### 4.1 Overall Feel

- Light and open layout
- Strong readability
- Soft contrast between background and content surfaces
- Clear hierarchy without dense enterprise styling
- Friendly but still business-appropriate

### 4.2 Page Composition

- Large hero area near the top, **left-aligned on all pages** (not centered)
- Main interactive controls grouped inside a raised white panel
- Content sections separated by spacing rather than heavy dividers
- Cards used as the primary content container
- Generous whitespace throughout
- Org pages may carry a right-side context panel (activity feed or summary)

### 4.3 Surface Style

- App background: very light gray or cool neutral
- Primary surfaces: white cards and panels
- Borders: subtle and low-contrast
- Shadows: soft and minimal, used mainly to lift cards and control panels
- Corners: rounded (medium radius), not exaggerated
- Hero banner (org portal): deep navy fill, white text

---

## 5. Typography Direction

### 5.1 Headings

- Bold, modern sans-serif style
- **Hero headline should be noticeably large** — significantly bigger than body content (e.g. ~2.8–3.5rem range on desktop)
- **Left-aligned** in the hero section
- Compact line height
- White text when on dark (navy) hero backgrounds

### 5.2 Body Text

- Clean sans-serif optimized for readability
- Neutral dark gray tone rather than pure black
- Comfortable line spacing

### 5.3 UI Labels

- Simple, direct wording
- Modest font size with clear hierarchy between labels, values, and helper text
- Column headers in tables: medium weight, not heavy

### 5.4 Badge / Eyebrow Text

- Small uppercase or tracked text above hero headlines
- Displayed as an outlined or subtle pill for public portal ("BROWSE TRAINING" style)
- Displayed as a circular graphic badge for org portal hero

---

## 6. Color Direction

### 6.1 Primary

- Deep navy blue (`#244b7f`) for primary actions, hero banners, and key emphasis
- Use for:
  - main filled buttons
  - org hero banner background
  - selected nav states
  - key links where emphasis is needed

### 6.2 Neutrals

- Very light gray background
- White surfaces and cards
- Mid-gray borders
- Dark slate for body text
- Lighter gray for secondary/meta text

### 6.3 Status Colors

Status pills should use **filled backgrounds**, not outlines:

| Status      | Background  | Text      |
|-------------|-------------|-----------|
| OPEN        | Green       | Dark/white|
| PUBLISHED   | Green       | Dark/white|
| LIMITED     | Amber/Orange| Dark      |
| DRAFT       | Amber/Orange| Dark      |
| CLOSED      | Light gray  | Mid gray  |
| ARCHIVED    | Light gray  | Mid gray  |

- Red reserved for destructive actions and hard errors only
- Status pills should be compact, rounded, readable at small size

### 6.4 Action Button Palette (Org Table)

Two distinct visual weights in table action areas:
- Primary action ("Open details"): blue outline button
- Secondary action ("Form designer"): ghost / teal-tinted outline button

---

## 7. Component Styling Rules

### 7.1 Global Navbar — Public Portal

- Logo left-aligned
- Horizontal nav links: Courses, About Us, Contact
- Login as a rounded pill button (outlined)
- Quiet visual treatment — white or very light background
- No overly heavy border-bottom

### 7.2 Global Navbar — Org Portal

- Logo + workspace name left-aligned
- **Centered global search bar** (full-width input, prominent)
- Right side: notification bell icon (with badge dot for unread), user avatar thumbnail + display name + dropdown caret, logout button
- White background, subtle bottom border

### 7.3 Hero Section

**Public portal hero:**
- Left-aligned content (not centered)
- Outlined eyebrow badge ("BROWSE TRAINING") above main heading
- Large bold headline
- Supporting paragraph below
- Light/neutral background; the hero blends into the page rather than a heavy contrast block

**Org portal hero:**
- Full-width dark navy banner
- Left-aligned: circular workspace logo badge + large white headline + lighter subtitle
- Optional help/documentation link inline with subtitle
- No search or actions embedded in the hero itself

### 7.4 Workflow Navigation Cards (Org Portal)

- Three white cards in a horizontal strip below the hero
- Each card: icon (top-left or left-aligned), title, short description
- **Active card**: colored left border (green or navy) + small "Active" badge top-right corner
- Inactive cards: subtle hover effect, same white surface
- Clicking a card navigates to the relevant section

### 7.5 Search / Filter Panel

- White floating panel with soft shadow
- Clearly labeled inputs: "Keyword search" label above input, "Enrollment Status" label above dropdown
- Horizontal layout on desktop: inputs side by side, CTA button at the right end
- Stacked layout on mobile
- Dropdown should show clear options (Open for Enrollment / Starting Soon / Ongoing / All)
- CTA button ("Filter Courses") uses filled dark primary style

### 7.6 Course Cards — Public Portal

- White card surface
- Medium rounded corners
- Light border and soft shadow
- "Published course" small gray label at top
- Bold course title
- Short summary text
- **Icon-based metadata row**: delivery mode (monitor icon), duration (clock icon), location (pin icon)
- Footer: status pill (OPEN / LIMITED / CLOSED, filled) left-aligned + "Review course" outline button right-aligned
- Consistent card height within rows; cards do not stretch vertically based on content

### 7.7 Course Table — Org Portal

- Full-width, white background table
- Subtle row borders (not zebra striping)
- Columns: Course Title & Description | Form Version | Delivery Mode | Date Range | Status | Next Step | Actions
- Status column: filled pill badges (see §6.3)
- Actions column: two buttons per row at different visual weights (§6.4)
- "Next step" column: plain text hint, lighter gray color, no decoration

### 7.8 Activity Feed Sidebar — Org Portal

- Visible on org dashboard / course list pages
- Right-side column, narrower than the main content area
- Each item: small avatar thumbnail, message text, relative timestamp (e.g. "3 days ago")
- Scrollable if items exceed visible height
- No heavy borders — blends with the page background
- Items are read-only contextual notifications, not interactive controls

### 7.9 Buttons

- Primary buttons: navy/dark fill, white text, rounded corners
- Outline buttons: colored border matching the action intent (blue for open details, teal/gray for secondary)
- Ghost buttons: minimal background, border only
- Sizes: default (table/form), large (hero CTAs)
- All buttons: consistent border-radius matching cards

### 7.10 Status Pills

- Compact, rounded (pill shape)
- Filled background (not outline-only)
- Dark readable text on light fills
- Used sparingly — tables and card footers only
- See §6.3 for color mapping

### 7.11 Page Footer — Public Portal

- Multi-column link footer at the bottom of public pages
- Columns: Home / Courses / Blog / Events | About / About Us / Contact | Login / Training
- Small copyright line at the bottom
- Quiet styling — no heavy background, same neutral tone as the page

---

## 8. Layout and Spacing

- Favor generous section spacing
- Keep card grids evenly aligned (3-column desktop, 2-column tablet, 1-column mobile)
- Avoid cramped controls
- Use spacing to create structure before adding borders or decoration
- Maintain a mobile-first layout that collapses gracefully
- Org portal may use a two-column layout: main content left, activity sidebar right
- Table cells: comfortable padding, not tight

---

## 9. Icon Usage

Icons should be introduced at the following touchpoints:
- **Course card metadata** (public portal): small inline icons for delivery mode, duration, location
- **Workflow nav cards** (org portal): one icon per card representing the section function
- **Navbar** (org portal): notification bell icon, user avatar
- **Table actions** (org portal): keep as text buttons; icons optional if space is constrained

Icon style: simple, single-color, consistent stroke weight. No filled multicolor icons.

---

## 10. Interaction Tone

- Interactions should feel clear and controlled
- Hover and focus states should be visible but subtle
- Active nav card: colored border, not background fill
- Loading states should be calm and unobtrusive
- Error states should be informative rather than alarming
- Dropdown menus should show options clearly with adequate padding

---

## 11. Reuse Across MVP Pages

This visual baseline should extend to:

- public course catalog ✓ (primary reference)
- public course detail and enrollment form
- org course management ✓ (primary reference)
- org submissions list
- org submission detail
- org audit page
- branding utility screen

Public pages: open, promotional, marketing-nav style.
Org pages: structured dashboard, richer navbar, possible activity sidebar.

---

## 12. Do / Avoid

### Do

- Left-align hero content on all pages
- Use filled status pills with distinct colors per status
- Add icon-based metadata to course cards
- Enrich the org navbar with search + notifications + user identity
- Show an "Active" badge on the current workflow nav card
- Use two visually distinct button styles in table action columns
- Include an activity feed sidebar on key org pages
- Add multi-column footer to public pages

### Avoid

- Center-aligned hero text (updated from v0.1)
- Outline-only status pills (should be filled)
- Minimal navbar with no user context in org portal
- Identical button styles for different action priorities in tables
- Dense enterprise styling
- Excessively rounded or playful components
- Heavy borders, noisy icons, or cluttered tables
- Dark-mode-first styling

---

## 13. Prompt Starter For External UI Tools

Use this prompt as a starting point for generating related mockups:

```text
Design a clean modern SaaS interface for an online training enrollment platform.
The public course catalog page should have a left-aligned hero with a large bold headline,
an outlined eyebrow badge, a horizontal filter panel (keyword search + status dropdown + CTA button),
and a 3-column grid of white course cards. Each card shows a title, summary, icon-based metadata
row (delivery, duration, location), a filled status badge (OPEN/LIMITED/CLOSED), and an outline
"Review course" button. Include a marketing navbar (logo, nav links, Login pill button) and a
multi-column footer.

The org course management page should have a persistent navbar with a centered search bar,
notification bell, and user avatar+name. Below that, a full-width dark navy hero banner with
left-aligned white headline. Then a three-card workflow nav strip with icons and an "Active"
badge on the current card. The main area shows a course data table with filled status pills
(DRAFT=amber, PUBLISHED=green, ARCHIVED=gray) and two-tone action buttons per row. A right
sidebar shows a contextual activity feed.

Overall aesthetic: trustworthy, calm, polished, spacious, mobile-friendly.
```
