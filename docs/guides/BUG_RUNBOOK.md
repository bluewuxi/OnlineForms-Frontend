# Bug Investigation Runbook

## Purpose

Provide a fast, repeatable workflow to investigate and verify bug fixes.

## 1) Capture Context

- Issue ID and severity
- Environment and deployment version/commit
- Exact page/route and timestamp
- Request ID and correlation ID when available

## 2) Reproduce

- Reproduce in lowest possible environment first (`local` -> `stage` -> `prod`).
- Capture exact reproduction steps and sample payloads.
- Confirm expected vs actual behavior.

## 3) Localize Root Cause

- Determine failure domain:
  - routing or role-guard
  - session/auth mode/token handling
  - API contract mismatch
  - CI/CD or environment variable drift
- Use browser network logs and backend logs together.

## 4) Fix Safely

- Implement the smallest safe change.
- Add/update tests that fail before and pass after.
- Validate role and tenant behavior.

## 5) Validate

- Run lint/tests/build as applicable.
- Verify target workflow in `stage`.
- Check related flows for regression.

## 6) Closeout

- Update issue with:
  - root cause
  - fix summary
  - validation evidence
  - rollback plan (if needed)
- Close issue after verification.

## Common Signals

- `401` from API: missing/invalid/expired bearer token or token-type mismatch.
- `403` from API: role denied, tenant mismatch, or membership issue.
- route loop/redirect: route guard and post-login target mismatch.
