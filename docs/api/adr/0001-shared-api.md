# ADR 0001: Shared API Client and Modules

Date: 2025-10-06

## Status
Accepted

## Context
HTTP interactions are currently spread across components, hooks, and services using a custom appFetch and raw fetch with inconsistent base URLs, no standard error handling, and missing timeouts/retries.

## Decision
- Transport: native fetch (no axios)
- Config: base URL key `react-app.api.url` via centralized loader mapping to `process.env.REACT_APP_API_URL`
- Error policy: `Result<T, ApiError>` returned from client; no thrown errors by default
- Timeout: default 12s via AbortController; per-request override
- Retry: only for idempotent GET, max 2 attempts with backoff ~200ms then ~800ms; disabled for mutating verbs; no retry on 4xx except optional 408
- Cancellation: expose abort via `createAbortableController`
- Logging: dev-only console.debug with correlation id; pluggable logger hook future
- Auth: header injection via token.service; refresh interface is a no-op in Task 1, to be implemented in Task 2
- Types: `src/shared/api/types.ts` with `ApiError`, `Result<T>`; DTOs in modules
- Modules: `src/shared/api/modules/*` with example `auth.login` and `requests.getClientRequests`

## Consequences
- Uniform error surface and request typing
- Safer defaults (timeouts) and resilience (limited retries for GET)
- Easier migration path by replacing ad-hoc calls with module functions
