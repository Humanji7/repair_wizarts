 Stage 1 Specification

  - Scope: unify every HTTP interaction behind shared/api, standardize
  configuration and error handling, and remove legacy ad-hoc clients.
  - Task 1
      - Inventory: catalog all API calls from src/services, Redux thunks,
  hooks, components, and utilities; capture HTTP verb, endpoint, query/
  body schema, headers, auth, error patterns, and owner feature.
      - Assessment log: document duplicates, inconsistent base URLs,
  missing timeouts/retries, non-typed responses, and security concerns.
      - Architecture draft: define shared/api structure (core client,
  modules per domain, DTO/adapter conventions), axios/fetch choice,
  interceptors (auth refresh, global error bus), timeout/retry policy,
  logging hook, and request/response typing approach.
      - Guidelines: prepare coding standards for new API modules (naming,
  return types, error surfaces), env variable usage (REACT_APP_API_URL,
  tokens), testing requirements, and onboarding notes.

      - Implementation plan (final):
        1) Inventory & Assessment
           - Scan all usages of appFetch and network calls across src/services, hooks, components, utilities.
           - Produce docs/api/inventory.json with fields: file, fn, verb, path, params/body, headers, needsAuth, errorHandling, featureOwner.
           - Produce docs/api/assessment.md summarizing duplicates, baseURL inconsistencies, missing timeouts/retries, typing gaps, and risks.
        2) Architecture skeleton for shared/api
           - Transport: native fetch (no axios introduction). Central client in src/shared/api/client.ts.
           - Config: base URL key is "react-app.api.url" via centralized config loader; allow fallback mapping to process.env if needed.
           - Error policy: Result<T, ApiError> everywhere; no throwing by default.
           - Timeout: default 12s via AbortController; per-request override.
           - Retry: only for idempotent GET, max 2 attempts with backoff ~200ms, then ~800ms; disabled for POST/PUT/DELETE; no retry on 4xx except optional 408.
           - Cancellation: expose cancel helpers (AbortController) from client.
           - Logging: dev-only console.debug with correlation id; pluggable logger hook.
           - Auth: src/shared/api/auth.ts provides header injection from token.service; refresh interface present as no-op for now (to be implemented in Task 2 when backend flow is defined).
           - Types: src/shared/api/types.ts with ApiError, Result<T>, basic DTO contracts.
           - Modules: src/shared/api/modules/{auth,requests,...}.ts with function stubs and 1–2 working examples (auth.login, requests.getClientRequests) on the new client.
        3) Guidelines
           - docs/api/guidelines.md: naming (modules/<domain>.ts, getX/createX/updateX), return types (Result<T, ApiError>), standardized error surface, usage of "react-app.api.url" key, testing requirements, onboarding steps.
        4) Tests (minimal)
           - Unit tests for client (success, timeout, normalized error) and example modules using fetch mocks.
           - Ensure npm run typecheck and npm test -- --watchAll=false pass.
        5) Acceptance for Task 1
           - Inventory and assessment docs created and reviewed.
           - ADR docs/api/adr/0001-shared-api.md describing decisions (transport, config key, error policy, timeout/retry, auth refresh no-op).
           - shared/api skeleton committed with examples; tests green; build unaffected.
        6) Follow-ups prepared (not executed here)
           - docs/api/migration-plan.md template with batch ordering and rollback notes.
           - Shortlist of first migration targets: auth, requests.
  - Task 2
      - Migration plan: order feature batches (critical auth/payments →
  high-traffic dashboards → ancillary legacy) with acceptance criteria
  and rollback notes per batch.
      - Implementation playbook: for each batch, create module under
  shared/api, replace old call sites, remove deprecated clients, run
  lint/typecheck/tests/smoke, and log outcome in migration sheet.
      - Consistency upgrades: enforce centralized config loader, shared
  auth/token refresh queue, standardized error normalization, DTO
  validators/mappers, and request cancellation helpers.
      - Quality gate: add integration/unit mocks for key endpoints,
  monitor bundle impact, run npx knip to flag unused legacy services,
  update developer docs/README, and baseline latency/error metrics before
  and after each migration slice.