import { supabase } from '../lib/supabase';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || 
  (import.meta.env.PROD ? 'https://api.toptruyenaudio.site/api/v1' : 'http://localhost:3001/api/v1');

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

// No token cache - always get fresh session from Supabase

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

  // Always get fresh session from Supabase before each request
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('[apiClient] Supabase session error:', sessionError);
    throw new ApiError(
      'Lỗi lấy session từ Supabase. Vui lòng đăng nhập lại.',
      'SESSION_ERROR',
      401
    );
  }

  if (!session || !session.access_token) {
    console.error('[apiClient] No active session found');
    throw new ApiError(
      'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.',
      'NO_SESSION',
      401
    );
  }

  // Set Authorization header with fresh token
  headers['Authorization'] = `Bearer ${session.access_token}`;
  console.log('[apiClient] Authorization header set:', headers['Authorization'].substring(0, 30) + '...');

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit',
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
  let isHtml = false;
  
  try {
    // First read as text to detect HTML responses
    const textBody = await response.text();
    
    // Check if response is HTML (indicates wrong endpoint or server error)
    if (textBody.trim().startsWith('<') && (textBody.includes('<!DOCTYPE') || textBody.includes('<html'))) {
      isHtml = true;
      console.error('[apiClient] Received HTML response instead of JSON:', {
        url,
        status: response.status,
        contentType,
        bodyPreview: textBody.substring(0, 200),
      });
      body = textBody;
    } else if (contentType && contentType.includes('application/json')) {
      // Parse as JSON if content-type says so
      try {
        body = JSON.parse(textBody);
      } catch (parseError) {
        console.error('[apiClient] Failed to parse JSON despite content-type:', parseError);
        body = textBody;
      }
    } else {
      // Try to parse as JSON anyway (some APIs don't set content-type correctly)
      try {
        body = JSON.parse(textBody);
      } catch {
        body = textBody;
      }
    }
  } catch (err) {
    console.error('[apiClient] Error reading response body:', err);
    body = null;
  }

  if (!response.ok) {
    // If we got HTML instead of JSON, it's likely a wrong endpoint
    if (isHtml) {
      throw new ApiError(
        `Server trả HTML thay vì JSON. Endpoint có thể sai: ${url}. Kiểm tra VITE_API_URL trong .env file.`,
        'HTML_RESPONSE_ERROR',
        response.status
      );
    }
    
    // 401 Unauthorized - Session expired, redirect to login
    if (response.status === 401) {
      console.error('[apiClient] 401 Unauthorized - session may be expired');
      throw new ApiError(
        'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        'SESSION_EXPIRED',
        401
      );
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
