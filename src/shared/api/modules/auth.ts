import { api } from '../client';
import type { Result } from '../types';

export type LoginPayload = { username: string; password: string };
export type LoginResponse = { access_token: string; refresh_token?: string };

export async function login(payload: LoginPayload): Promise<Result<LoginResponse>> {
  return api.post<LoginResponse>('auth/login', payload);
}
