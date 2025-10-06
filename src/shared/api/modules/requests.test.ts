import { api } from '../client';

describe('requests module', () => {
  it('getClientRequests calls GET with retry', async () => {
    const spy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ([]),
    } as any);
    const res = await api.get<any>('drive', { retry: { attempts: 2, backoffMs: [200, 800] } });
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalled();
  });
});
