import { getConfigValue } from './config';
import { getAuthHeaders } from './auth';
import { attemptTokenRefresh } from './token';
import type { ApiError, RequestOptions, Result } from './types';

function buildUrl(base: string, path: string, query?: RequestOptions['query']): string {
  const effectiveBase = base && /^https?:\/\//.test(base) ? base : 'http://localhost/';
  const isAbsolute = /^https?:\/\//.test(path);
  const url = isAbsolute ? new URL(path) : new URL(path, effectiveBase);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === undefined) return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function toApiError(e: unknown, status = 0, correlationId?: string): ApiError {
  if (typeof e === 'object' && e && 'status' in (e as any)) return e as ApiError;
  const message = e instanceof Error ? e.message : 'Request failed';
  return { status, message, correlationId };
}

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

export function createAbortableController(timeoutMs?: number, external?: AbortSignal) {
  const controller = new AbortController();
  const timeout = typeof timeoutMs === 'number' ? timeoutMs : 12000; // default 12s
  const t = setTimeout(() => controller.abort(), timeout);
  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', () => controller.abort());
    }
  }
  return { signal: controller.signal, dispose: () => clearTimeout(t) };
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<Result<T>> {
  const base = getConfigValue('react-app.api.url') || '';
  const correlationId = Math.random().toString(36).slice(2);
  const url = buildUrl(base, path, opts.query);

  const method = opts.method || 'GET';
  const body = opts.body !== undefined && method !== 'GET' ? JSON.stringify(opts.body) : undefined;

  const { signal, dispose } = createAbortableController(opts.timeoutMs, opts.signal);

  const doFetch = async (isRetry = false, overrideAuthHeaders?: Record<string, string>): Promise<Result<T>> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...opts.headers,
      ...overrideAuthHeaders || getAuthHeaders(),
    };
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[api]', correlationId, method, url);
      }
      const resp = await fetch(url, { method, headers, body, signal });
      const ct = resp.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      const data = isJson ? await resp.json().catch(() => undefined) : await resp.text();
      if (resp.ok) {
        return { ok: true, data: data as T, correlationId };
      }

      // Handle 401 Unauthorized - try to refresh token
      if (resp.status === 401 && !isRetry && headers.Authorization) {
        const refreshSuccess = await attemptTokenRefresh();
        if (refreshSuccess) {
          // Retry with updated auth headers
          return await doFetch(true, getAuthHeaders());
        }
        // If refresh failed, return original 401 error
      }

      const err: ApiError = {
        status: resp.status,
        message: (data && (data.detail || data.message)) || resp.statusText || 'HTTP error',
        correlationId,
        details: data,
      };
      return { ok: false, error: err, correlationId };
    } catch (e) {
      return { ok: false, error: toApiError(e, 0, correlationId), correlationId };
    }
  };

  const isIdempotentGet = method === 'GET';
  const attempts = isIdempotentGet ? Math.min(opts.retry?.attempts ?? 2, 4) : 0;
  const backoff = opts.retry?.backoffMs ?? [200, 800];

  let result = await doFetch();
  for (let i = 0; i < attempts && !result.ok; i++) {
    const s = result.error.status;
    if (s && (s >= 400 && s < 500) && s !== 408) break; // no retry on 4xx except optional 408
    await sleep(backoff[Math.min(i, backoff.length - 1)]);
    result = await doFetch();
  }

  dispose();
  return result;
}

export const api = {
  get: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => request<T>(path, { ...opts, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => request<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => request<T>(path, { ...opts, method: 'DELETE' }),
};
