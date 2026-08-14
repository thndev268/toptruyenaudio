import { apiRequest, setAccessToken } from '../apiClient';

export class ApiAuthRepository {
  async register(email: string, password: string, displayName: string) {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    if (res.tokens?.accessToken) {
      setAccessToken(res.tokens.accessToken);
    }
    return res;
  }

  async login(email: string, password: string) {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.tokens?.accessToken) {
      setAccessToken(res.tokens.accessToken);
    }
    return res;
  }

  async getMe() {
    return apiRequest('/auth/me', { method: 'GET' });
  }

  async logout(refreshToken?: string) {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: refreshToken || '' }),
      });
    } finally {
      setAccessToken(null);
    }
  }

  async logoutAll() {
    try {
      await apiRequest('/auth/logout-all', { method: 'POST' });
    } finally {
      setAccessToken(null);
    }
  }
}

export const apiAuthRepository = new ApiAuthRepository();
