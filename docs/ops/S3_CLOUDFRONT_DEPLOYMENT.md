# S3 + CloudFront Deployment Notes

Date created: 2026-03-10
Repository: bluewuxi/OnlineForms-Frontend

## Purpose

Capture the deployment assumptions for hosting the frontend as static assets behind S3 and CloudFront.

## Build Output

- Run `npm run build`
- Output directory: `dist/`
- The build includes:
  - `index.html`
  - versioned JS/CSS assets
  - `404.html` copied from `index.html` to help SPA fallback behavior

## Environment

- Required runtime config:
  - `VITE_API_BASE_URL`
- Production should point to:
  - `https://y36enrj145.execute-api.ap-southeast-2.amazonaws.com/v1`

## S3 Setup

1. Create or choose an S3 bucket for static frontend assets
2. Upload the contents of `dist/`
3. Ensure `index.html` and `404.html` are present at the bucket root
4. Keep long-lived cache behavior for hashed asset files
5. Keep shorter cache behavior for `index.html` and `404.html`

## CloudFront Setup

1. Point a CloudFront distribution at the S3 origin
2. Set the default root object to `index.html`
3. Configure SPA fallback behavior:
   - 403 -> `/index.html`
   - 404 -> `/index.html`
   - response code `200`
4. Forward only the headers/query/cookies that are actually needed
5. Enable compression for static assets

## Routing Notes

This frontend uses React Router, so deep links such as:

- `/t/acme-training/courses`
- `/t/acme-training/courses/crs_123`
- `/org/submissions/sub_123`

must resolve back to `index.html` at the CDN layer.

## Release Checklist

1. Run `npm run lint`
2. Run `npm run test`
3. Run `npm run build`
4. Upload `dist/` to S3
5. Invalidate CloudFront cache for:
   - `/index.html`
   - `/404.html`
   - optionally `/*` for a broader release
6. Run the smoke checklist in `docs/ops/FRONTEND_SMOKE_CHECKLIST.md`

## Notes

- Asset file names are content-hashed, which makes them cache-friendly
- `index.html` should be treated as the main deployment control file
- If a custom domain is used, pair CloudFront with ACM and Route 53
