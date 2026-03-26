# Changelog

All notable changes to this project will be documented in this file.

## [0.1.2.0] - 2026-03-26

### Fixed
- Fixed Cognito post-login internal management entry so internal access validates with `internal_admin` and no tenant context.
- Fixed frontend session-context mapping to preserve `canAccessInternalPortal` and nullable internal tenant bootstrap behavior.
- Added regression coverage for claim-based internal management access and cleared shared query cache between app routing tests.

## [0.1.1.0] - 2026-03-26

### Added
- Added an internal users access-control console with lifecycle actions, role management, password reset, activity timeline, and read-only tenant visibility.
- Added internal logout activity capture and internal-login context validation support in the frontend flow.

### Changed
- Reworked the internal users page into a selected-user workspace with richer API contracts and dedicated UI states.
- Updated frontend spec and README coverage for the internal portal management flow.

### Fixed
- Fixed workspace selection behavior so visible user identity stays aligned with mutation targets during rapid switching.
