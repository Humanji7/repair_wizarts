import { api } from './client';

describe('api client', () => {
  const originalFetch = global.fetch as any;
  beforeEach(() => {
    jest.useFakeTimers();
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
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.hello).toBe('world');
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
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.status).toBe(500);
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
    expect(res.ok).toBe(false);
  });
});
