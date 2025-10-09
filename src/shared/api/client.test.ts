import { api } from './client';
import { getToken } from '../../services/token.service';
import type { Err, Ok, Result } from './types';

jest.mock('../../services/token.service', () => ({
  getToken: jest.fn(),
}));

describe('api client', () => {
  const originalFetch = global.fetch as any;
  const mockGetToken = getToken as jest.MockedFunction<typeof getToken>;

  function assertOk<T>(result: Result<T>): asserts result is Ok<T> {
    expect(result.ok).toBe(true);
  }

  function assertErr<T>(result: Result<T>): asserts result is Err {
    expect(result.ok).toBe(false);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockReset();
  });

  afterEach(() => {
    (global.fetch as any) = originalFetch;
  });

  it('returns ok on 200 JSON', async () => {
    (global.fetch as any) = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ hello: 'world' }),
    });

    const res = await api.get<{ hello: string }>('test');

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

    const res = await api.get<any>('test');

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

    const res = await api.get<any>('test', { signal: controller.signal });

    assertErr(res);
  });

  it('sends urlencoded POST body with auth token and hash', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    (global.fetch as any) = fetchMock;
    mockGetToken.mockReturnValue({ token: 'abc', hash: 'def' } as any);

    await api.post('secure', { foo: 'bar', baz: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const sentBody = init.body as URLSearchParams;
    expect(sentBody).toBeInstanceOf(URLSearchParams);
    expect(sentBody.get('foo')).toBe('bar');
    expect(sentBody.get('baz')).toBe('1');
    expect(sentBody.get('token')).toBe('abc');
    expect(sentBody.get('u_hash')).toBe('def');
  });

  it('appends auth params to FormData without overriding headers', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({}),
    });
    (global.fetch as any) = fetchMock;
    mockGetToken.mockReturnValue({ token: 'tok', hash: 'hash' } as any);

    const form = new FormData();
    form.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');

    await api.post('upload', form);

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers).toEqual({});
    const sentForm = init.body as FormData;
    expect(sentForm.get('token')).toBe('tok');
    expect(sentForm.get('u_hash')).toBe('hash');
    const fileEntry = sentForm.get('file') as Blob;
    expect(fileEntry).toBeInstanceOf(Blob);
    expect(fileEntry.size).toBeGreaterThan(0);
  });
});
