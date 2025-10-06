# Migration Plan (Template)

## Batches
1. Auth
   - Targets: login, token refresh, user/authorized
   - Acceptance: shared/api/modules/auth.ts functions used; legacy calls replaced; tests green
   - Rollback: revert module imports; restore appFetch usage
2. Requests
   - Targets: drive, drive/archive, submission/request endpoints
   - Acceptance: shared/api/modules/requests.ts used in services/components; tests green
   - Rollback: revert module imports; restore appFetch usage

## Checklist per Batch
- Replace call sites with shared/api module functions
- Remove deprecated client usage
- Update env: REACT_APP_API_URL configured
- Run lint, format, typecheck, tests
- Smoke test critical flows
- Log outcomes and any regressions
