import { api } from '../client';
import type { Result } from '../types';

export type RequestItem = { id: number; title: string };

export async function getClientRequests(): Promise<Result<RequestItem[]>> {
  return api.get<RequestItem[]>('drive', { retry: { attempts: 2, backoffMs: [200, 800] } });
}
