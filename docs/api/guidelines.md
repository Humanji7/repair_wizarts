# Shared API Guidelines

- Modules location: `src/shared/api/modules/<domain>.ts` using verbs: `getX`, `createX`, `updateX`, `deleteX`.
- Return types: every function returns `Result<T>` from `src/shared/api/types.ts`. No thrown errors by default.
- Error surface: `ApiError { status, message, code?, details?, correlationId? }`.
- Config: base URL key is `react-app.api.url` via `getConfigValue`. Map to `process.env.REACT_APP_API_URL`.
- Transport: native `fetch`; no axios.
- Timeout: default 12s via `AbortController` in client. Per-request override via `timeoutMs`.
- Retry: Only for idempotent GET, max 2 attempts with backoff `[200, 800]`. Disabled for mutating verbs.
- Cancellation: use `createAbortableController` and pass `signal` from consuming components/hooks.
- Logging: dev-only `console.debug('[api]', correlationId, method, url)`.
- Auth: `getAuthHeaders()` injects `Authorization` if available. Refresh queue is no-op in Task 1; implement in Task 2.
- DTOs: define basic request/response DTOs in modules; adaptors/validators can be added alongside if needed.
- Testing: unit test client success/timeout/error normalization; test example modules via fetch mocks.
- Onboarding: developers should migrate legacy calls to modules, remove ad-hoc clients, and follow naming/typing conventions.
