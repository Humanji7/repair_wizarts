import { api } from './client';
import * as authModule from './auth';
import type { Err, Ok, Result } from './types';

jest.mock('./auth', () => ({
  getAuthHeaders: jest.fn(),
}));

describe('api client', () => {
  const originalFetch = global.fetch as any;
  const mockGetAuthHeaders = authModule.getAuthHeaders as jest.MockedFunction<typeof authModule.getAuthHeaders>;

  function assertOk<T>(result: Result<T>): asserts result is Ok<T> {
    expect(result.ok).toBe(true);
  }

  function assertErr<T>(result: Result<T>): asserts result is Err {
    expect(result.ok).toBe(false);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    (global.fetch as any) = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns ok on 200 JSON', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ hello: 'world' }),
    });
    const res = await api.get<{ hello: string }>('test', { retry: { attempts: 0 } });
    assertOk(res);
    expect(res.data.hello).toBe('world');
  });

  it('returns error on non-2xx', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'boom' }),
    });
    const res = await api.get<any>('test', { retry: { attempts: 0 } });
    assertErr(res);
    expect(res.error.status).toBe(500);
  });

  it('aborts via external signal', async () => {
    (global.fetch as any) = jest.fn().mockImplementation((_url: string, init?: any) => {
      return new Promise((_resolve, reject) => {
        const signal: AbortSignal | undefined = init?.signal;
        if (signal?.aborted) {
          reject(new Error('AbortError'));
          return;
        }
        signal?.addEventListener('abort', () => reject(new Error('AbortError')));
      });
    });
    const controller = new AbortController();
    controller.abort();
    const res = await api.get<any>('test', { signal: controller.signal, retry: { attempts: 0 } });
    assertErr(res);
  });

  it('returns 401 error responses without retrying when authorized request fails', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'unauthorized' }),
    });
    (global.fetch as any) = fetchMock;

    mockGetAuthHeaders.mockReturnValue({ Authorization: 'Bearer token' });

    const res = await api.get<any>('test', { retry: { attempts: 0 } });

    assertErr(res);
    expect(res.error.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
