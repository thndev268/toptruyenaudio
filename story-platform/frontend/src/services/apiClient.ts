import { supabase } from '../lib/supabase';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || '/api/v1';

export class ApiError extends Error {
  code: string;
  fields?: Record<string, any>;
  requestId?: string;
  status: number;

  constructor(message: string, code: string, status: number, fields?: Record<string, any>, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fields = fields;
    this.requestId = requestId;
  }
}

export type DataSourceMode = 'API' | 'MOCK' | 'SUPABASE';

export function getDataSourceMode(): DataSourceMode {
  const env = (import.meta as any).env || {};
  if (env.PROD) {
    return 'API';
  }
  if (env.VITE_DATA_SOURCE_MODE === 'MOCK') {
    return 'MOCK';
  }
  if (env.VITE_DATA_SOURCE_MODE === 'SUPABASE') {
    return 'SUPABASE';
  }
  return 'API';
}

// In-Memory Token Store - Access token is NEVER stored in LocalStorage/SessionStorage
let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

// One-time cleanup of legacy auth token from LocalStorage if present (Migration step)
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  if (localStorage.getItem('toptruyenaudio:token:v1')) {
    localStorage.removeItem('toptruyenaudio:token:v1');
  }
}

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export async function refreshAccessTokenSingleFlight(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.access_token) {
          setAccessToken(session.access_token);
          return session.access_token;
        }
        setAccessToken(null);
        return null;
      } catch (err) {
        setAccessToken(null);
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
  _isRetry = false
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const customHeaders = (options.headers || {}) as Record<string, string>;
  const headers: Record<string, string> = {
    ...customHeaders,
  };

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // Always try to get the latest token from Supabase if not set
  if (!accessToken) {
     const { data: { session } } = await supabase.auth.getSession();
     if (session?.access_token) {
        setAccessToken(session.access_token);
     }
  }

  if (accessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit', // No longer using cookies for auth, using Bearer token from Supabase
    });
  } catch (err) {
    throw new ApiError(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
      'NETWORK_ERROR',
      0
    );
  }

  const contentType = response.headers.get('content-type');
  let body: any;
  try {
    if (contentType && contentType.includes('application/json')) {
      body = await response.json();
    } else {
      body = await response.text();
    }
  } catch (err) {
    body = null;
  }

  if (!response.ok) {
    // 401 Unauthorized - Handle token refresh if not already retrying
    if (response.status === 401 && !_isRetry && !endpoint.includes('auth/login')) {
      const newAccessToken = await refreshAccessTokenSingleFlight();
      if (newAccessToken) {
        // Retry the original request exactly once
        return apiRequest(endpoint, options, true);
      }
    }

    if (response.status === 403) {
      throw new ApiError(
        body?.error?.message || 'Bạn không có quyền thực hiện hành động này.',
        'FORBIDDEN',
        403,
        body?.error?.fields,
        body?.error?.requestId
      );
    }

    if (response.status === 409) {
      throw new ApiError(
        body?.error?.message || 'Xung đột dữ liệu. Dữ liệu đã được thay đổi bởi người khác.',
        'CONFLICT',
        409,
        body?.error?.fields,
        body?.error?.requestId
      );
    }

    if (response.status === 503) {
      throw new ApiError(
        'Hệ thống đang bảo trì hoặc quá tải. Vui lòng thử lại sau ít phút.',
        'SERVICE_UNAVAILABLE',
        503,
        undefined,
        response.headers.get('x-request-id') || undefined
      );
    }

    const errDetail = body?.error || {};
    throw new ApiError(
      errDetail.message || 'Thao tác không thành công',
      errDetail.code || 'UNKNOWN_ERROR',
      response.status,
      errDetail.fields,
      errDetail.requestId,
    );
  }

  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}
