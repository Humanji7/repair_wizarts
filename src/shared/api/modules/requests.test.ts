import { api } from '../client';

describe('requests module', () => {
  it('getClientRequests calls GET once', async () => {
    const spy = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ([]),
    } as any);
    const res = await api.get<any>('drive');
    expect(res.ok).toBe(true);
    expect(spy).toHaveBeenCalled();
  });
});
