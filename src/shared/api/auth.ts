import { getToken } from '../../services/token.service';

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token?.access_token) return {};
  return { Authorization: `Bearer ${token.access_token}` };
}

export async function maybeRefreshToken(_resp: Response): Promise<boolean> {
  // No-op in Task 1; to be implemented in Task 2 when backend flow is defined
  return false;
}
