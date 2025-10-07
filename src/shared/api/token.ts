import { refreshToken } from './modules/auth';
import { setToken, clearToken } from '../../services/token.service';

// Token refresh helper to avoid circular imports
export async function attemptTokenRefresh(): Promise<boolean> {
  try {
    const storedToken = localStorage.getItem('auth_tokens');
    if (!storedToken) {
      return false;
    }

    const tokenData = JSON.parse(storedToken);
    if (!tokenData.refresh_token) {
      return false;
    }

    const refreshResult = await refreshToken(tokenData.refresh_token);
    if (refreshResult.ok) {
      setToken(refreshResult.data);
      return true;
    } else {
      clearToken();
      return false;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearToken();
    return false;
  }
}