# OnlineForms Frontend Visual Baseline

Version: 0.1 (Draft)
Date: 2026-03-10
Repository: bluewuxi/OnlineForms-Frontend
Reference:
- MVP example layout provided in thread on 2026-03-10
- `docs/specs/FRONTEND_UI_SPEC.md`

## 1. Purpose

Define the visual direction for the OnlineForms MVP frontend so generated mockups, implementation work, and later design refinements all start from the same styling baseline.

## 2. Design Intent

The MVP should feel:

- modern
- trustworthy
- calm
- professional
- simple to use

The visual tone should support a SaaS product demo without feeling too corporate, too playful, or overly decorative.

## 3. Baseline Page Reference

The baseline reference is the public course catalog mockup with:

- centered hero headline
- tenant/provider badge above the hero
- floating search/filter panel
- white course cards in a clean grid
- dark blue primary action buttons

This page should be treated as the core visual language for the MVP.

## 4. Visual Characteristics

### 4.1 Overall Feel

- Light and open layout
- Strong readability
- Soft contrast between background and content surfaces
- Clear hierarchy without dense enterprise styling
- Friendly but still business-appropriate

### 4.2 Page Composition

- Large centered hero area near the top of the page
- Main interactive controls grouped inside a raised white panel
- Content sections separated by spacing rather than heavy dividers
- Cards used as the primary content container
- Generous whitespace throughout

### 4.3 Surface Style

- App background uses a very light gray or cool neutral tone
- Primary surfaces use white cards and panels
- Borders should be subtle and low-contrast
- Shadows should be soft and minimal, used mainly to lift cards and control panels
- Corners should be rounded, but not exaggerated

## 5. Typography Direction

### 5.1 Headings

- Bold, modern sans-serif style
- High contrast and strong clarity
- Large hero headline with compact line height

### 5.2 Body Text

- Clean sans-serif optimized for readability
- Neutral dark gray tone rather than pure black
- Comfortable line spacing

### 5.3 UI Labels

- Simple, direct wording
- Modest font size with clear hierarchy between labels, values, and helper text

## 6. Color Direction

The palette should stay restrained and product-oriented.

### 6.1 Primary

- Deep navy blue for primary actions
- Use for:
  - main buttons
  - key links where emphasis is needed
  - selected states sparingly

### 6.2 Neutrals

- Very light gray background
- White surfaces
- Mid-gray borders
- Dark slate text
- Lighter gray secondary text

### 6.3 Status Colors

- Green for open/positive states
- Amber or muted gold for warning or closing soon states
- Gray for neutral/inactive states
- Red reserved for destructive or failure states only

Status colors should be softened into pill badges instead of loud alert tones.

## 7. Component Styling Rules

### 7.1 Header

- Minimal top navigation
- Clean horizontal spacing
- Quiet visual treatment so the hero remains the focal point

### 7.2 Hero Section

- Center-aligned content
- Tenant/provider badge above the main heading
- Clear supporting sentence below the heading
- Spacious top and bottom padding

### 7.3 Search Panel

- White floating panel with soft shadow
- Rounded outer container
- Horizontal layout on desktop
- Stacked layout on mobile
- Inputs should appear tidy and easy to scan

### 7.4 Course Cards

- White card surface
- Medium rounded corners
- Light border and soft shadow
- Title at top with strong emphasis
- Short summary text underneath
- Metadata row near the lower portion of the card
- Status pill aligned with metadata or action area
- Full-width primary button at the bottom

### 7.5 Buttons

- Primary buttons use navy background with white text
- Rounded corners consistent with the rest of the UI
- Slight pressed or depth feel is acceptable
- Buttons should feel solid and dependable, not flashy

### 7.6 Status Pills

- Compact
- Rounded
- Soft fill color
- Dark readable text
- Used sparingly for status communication

## 8. Layout and Spacing

- Favor generous section spacing
- Keep card grids evenly aligned
- Avoid cramped controls
- Use spacing to create structure before adding borders or decoration
- Maintain a mobile-first layout that collapses gracefully

## 9. Interaction Tone

- Interactions should feel clear and controlled
- Hover and focus states should be visible but subtle
- Loading states should be calm and unobtrusive
- Error states should be informative rather than alarming

## 10. Reuse Across MVP Pages

This visual baseline should extend to:

- public course catalog
- public course detail and enrollment form
- org submissions list
- org submission detail
- org audit page
- branding utility screen

Public pages can feel slightly more open and promotional.
Org pages can be slightly denser, but should reuse the same card, button, badge, and typography language.

## 11. Do / Avoid

### Do

- Use light backgrounds and white content surfaces
- Keep the interface polished and uncluttered
- Prefer calm shadows and restrained color use
- Make primary actions obvious
- Preserve strong spacing rhythm

### Avoid

- Dark-mode-first styling for MVP
- Overly flashy gradients or marketing-heavy visuals
- Excessively rounded or playful components
- Dense admin-dashboard styling too early
- Heavy borders, noisy icons, or cluttered tables

## 12. Prompt Starter For External UI Tools

Use this prompt as a starting point for generating related mockups:

```text
Design a clean modern SaaS interface for an online training enrollment platform called OnlineForms. Use a light gray background, white elevated cards, rounded corners, subtle shadows, dark navy primary buttons, soft status pills, and bold modern typography. The interface should feel trustworthy, calm, polished, and mobile-friendly. Keep the design simple, spacious, and demo-ready rather than flashy.
```
