import { getConfigValue } from './config';
import { getToken } from '../../services/token.service';
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

function buildPostBody(body: RequestOptions['body']): BodyInit | undefined {
  const token = getToken();
  const authToken = token?.token;
  const authHash = token?.hash;

  if (body instanceof FormData) {
    if (authToken && authHash) {
      body.set('token', authToken);
      body.set('u_hash', authHash);
    }
    return body;
  }

  if (body instanceof URLSearchParams) {
    if (authToken && authHash) {
      body.set('token', authToken);
      body.set('u_hash', authHash);
    }
    return body.toString() ? body : authToken && authHash ? body : undefined;
  }

  const params = new URLSearchParams();
  let hasEntries = false;

  if (authToken && authHash) {
    params.set('token', authToken);
    params.set('u_hash', authHash);
    hasEntries = true;
  }

  if (body && typeof body === 'object') {
    Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        value.forEach((v) => {
          if (v === undefined || v === null) return;
          params.append(key, String(v));
          hasEntries = true;
        });
        return;
      }
      params.append(key, String(value));
      hasEntries = true;
    });
  } else if (body !== undefined && body !== null) {
    params.append('value', String(body));
    hasEntries = true;
  }

  return hasEntries ? params : authToken && authHash ? params : undefined;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<Result<T>> {
  const base = getConfigValue('react-app.api.url') || '';
  const correlationId = Math.random().toString(36).slice(2);
  const url = buildUrl(base, path, opts.query);

  const method = opts.method || 'GET';
  const body = method === 'POST' ? buildPostBody(opts.body) : undefined;

  const { signal, dispose } = createAbortableController(opts.timeoutMs, opts.signal);

  const headers: Record<string, string> = {
    ...opts.headers,
  };

  if (method === 'POST' && body && !(body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';
  }

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[api]', correlationId, method, url);
    }
    const resp = await fetch(url, { method, headers, body: body ?? undefined, signal });
    const ct = resp.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    const data = isJson ? await resp.json().catch(() => undefined) : await resp.text();
    if (resp.ok) {
      return { ok: true, data: data as T, correlationId };
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
  } finally {
    dispose();
  }
}

export const api = {
  get: <T>(path: string, opts: Omit<RequestOptions, 'method' | 'body'> = {}) => request<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...opts, method: 'POST', body }),
};
