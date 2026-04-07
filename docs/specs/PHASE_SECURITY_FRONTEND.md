# OnlineForms Frontend — Security Hardening Phase

Source: Security review covering public form abuse prevention, input safety, session hygiene, and supply-chain hygiene. Companion backend phase: `OnlineForms/docs/specs/PHASE_SECURITY_BACKEND.md`.

## Goals

- Reduce the attack surface of the public enrollment form against automated abuse
- Prevent client-side XSS vectors introduced by rendered submission content
- Enforce field constraints in the UI to complement server-side validation
- Harden session handling and external link hygiene
- Establish ongoing dependency vulnerability scanning

## Scope

Frontend-only changes. No new API endpoints are introduced by this phase, though some tasks depend on new backend responses (e.g. `429 Too Many Requests`, CAPTCHA token verification) defined in the backend phase.

## Workflow Rule

Implement tasks strictly in order. For each task:
1. Implement feature
2. Write brief change summary in linked GitHub issue
3. Update checklist status
4. Move to next task

## Tasks

- [ ] FS-01 Enrollment form field length constraints
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/TBD
  Scope:
  - Add `maxLength` attribute to every `<input type="text">`, `<input type="email">`, and `<textarea>` rendered inside `EnrollmentForm` based on field type:
    - Short text fields: `maxLength={500}`
    - Long text / textarea: `maxLength={5000}`
    - Email fields: `maxLength={254}` (RFC 5321 maximum)
  - Add a live character counter hint below textarea fields when content exceeds 80% of the limit, e.g. "420 / 500"
  - Validate these limits in the client-side submit handler and show an inline field error if exceeded (do not rely solely on the HTML attribute, which can be bypassed)
  - Ensure the constraints are consistent with whatever the backend enforces (coordinate with FS-03 backend phase)
  Acceptance:
  - No enrollment form field accepts more than its defined maximum
  - Character counter appears for textarea fields near the limit
  - Exceeding the limit blocks form submission with a clear inline error

- [ ] FS-02 Friendly 429 rate-limit error state
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/TBD
  Scope:
  - The enrollment form submission handler currently shows a generic error banner on API failure
  - Detect HTTP `429 Too Many Requests` responses from `POST /v1/public/{tenantCode}/courses/{courseId}/enrollments` specifically
  - Render a distinct, friendly error state (not the generic red banner) when `429` is received:
    - Heading: "You've submitted too many applications recently"
    - Message: "Please wait a while before trying again. If you believe this is an error, contact the training provider."
    - Do not show a retry button on `429` — instead show the course detail link
  - This is a frontend concern only; the actual rate limiting is enforced by the backend (see backend phase BS-01)
  Acceptance:
  - `429` response renders the specific rate-limit message
  - Other `4xx`/`5xx` errors continue to render the existing generic error state
  - No retry button appears on the `429` state

- [ ] FS-03 Honeypot field on enrollment form
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/TBD
  Scope:
  - Add a hidden honeypot `<input>` field to the enrollment form that is invisible to human users but visible to bots that auto-fill all fields
  - Implementation:
    - Add `<input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />` inside the form
    - Hide it with CSS: `position: absolute; left: -9999px; opacity: 0; height: 0;` — do NOT use `display: none` or `visibility: hidden` as some bots detect these
    - Give it a plausible name (`website`, `url`, `address2`) to attract bots
    - In the submit handler, check if the honeypot field has a value; if so, silently pretend the submission succeeded (show the success state) without actually calling the API — do not alert the bot that it was caught
  - Send the honeypot flag to the backend as a boolean `_hp` field in the submission payload so the backend can also log/reject it (coordinate with backend phase BS-03)
  Acceptance:
  - Honeypot field is not visible or tab-reachable by human users
  - Form submission with honeypot filled never reaches the API
  - Success state is shown to fool bots into thinking submission worked
  - Automated test verifies the honeypot field is present but hidden

- [ ] FS-04 CAPTCHA widget integration (Cloudflare Turnstile)
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/TBD
  Scope:
  - Integrate Cloudflare Turnstile (invisible mode) into the public enrollment form
  - Why Turnstile: invisible by default (no puzzle), free, privacy-friendly, no Google dependency
  - Implementation:
    - Install `@marsidev/react-turnstile` (lightweight React wrapper)
    - Add `VITE_TURNSTILE_SITE_KEY` environment variable; document in `.env.example`
    - Render `<Turnstile siteKey={...} onSuccess={(token) => setTurnstileToken(token)} />` inside the enrollment form, hidden below the submit button
    - Include the `turnstileToken` in the submission payload as `_captchaToken`
    - If Turnstile fails to load (network error, ad-blocker), degrade gracefully — do not block the form, but log a console warning
    - Block form submission until a token is obtained; show a subtle loading indicator on the submit button
    - Backend verifies the token against Cloudflare's API before processing (backend phase BS-02)
    - Add `VITE_TURNSTILE_ENABLED=true/false` flag so the widget can be disabled in local/test environments without breaking tests
  Acceptance:
  - Turnstile widget renders on the enrollment form in production mode
  - Submit button is disabled until a token is available
  - `_captchaToken` is included in the submission payload
  - In test/dev mode (`VITE_TURNSTILE_ENABLED=false`) the form works without a token
  - Existing enrollment form tests continue to pass

- [ ] FS-05 XSS hygiene — external links and rendered content
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/TBD
  Scope:
  - Audit all `<a target="_blank">` links across the codebase and add `rel="noopener noreferrer"` to prevent tab-napping attacks (the opened page can otherwise access `window.opener` and redirect the parent tab)
  - Audit the `RichText` component — it renders raw HTML via `dangerouslySetInnerHTML`. Verify that all HTML passed to it originates from the backend (trusted source), not from user-submitted content. Add a code comment documenting this trust assumption.
  - If any submission answer is ever rendered via `RichText` or `dangerouslySetInnerHTML`, replace it with a plain text renderer (no HTML interpretation)
  - Add ESLint rule `react/jsx-no-target-blank` to the lint config to automatically catch future `target="_blank"` without `rel` attributes
  Acceptance:
  - All `target="_blank"` links have `rel="noopener noreferrer"`
  - `RichText` is documented as trusted-source only
  - ESLint rule is active and CI enforces it

- [ ] FS-06 Dependency vulnerability scanning
  Issue: https://github.com/bluewuxi/OnlineForms-Frontend/issues/TBD
  Scope:
  - Add `npm audit --audit-level=high` to the CI pipeline (GitHub Actions or equivalent) so high/critical CVEs fail the build
  - Enable GitHub Dependabot for the `OnlineForms-Frontend` repository:
    - Create `.github/dependabot.yml` with weekly `npm` updates targeting the `master` branch
    - Group patch updates into a single PR to reduce noise
  - Resolve any currently open `npm audit` findings of severity `high` or above before closing this task
  Acceptance:
  - `npm audit --audit-level=high` exits 0 on current dependencies
  - Dependabot config file is present and valid
  - CI pipeline fails on future high/critical CVEs

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

## Primary References

- `docs/specs/PHASE_SECURITY_BACKEND.md` (companion backend phase — `OnlineForms` repo)
- `src/pages/public/CourseDetailPage.tsx` — enrollment form entry point
- `src/components/content/RichText.tsx` — HTML renderer to audit
