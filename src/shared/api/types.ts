export type ApiError = {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
  correlationId?: string;
};

export type Ok<T> = { ok: true; data: T; error?: never; correlationId?: string };
export type Err = { ok: false; error: ApiError; data?: never; correlationId?: string };
export type Result<T> = Ok<T> | Err;

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  retry?: {
    attempts?: number; // only for GET
    backoffMs?: number[]; // e.g., [200, 800]
  };
};
