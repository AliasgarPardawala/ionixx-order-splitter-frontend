import { API_BASE_URL } from '../config';
import type { ApiErrorBody } from './types';

/** Thrown for any non-2xx response. Carries the backend's structured error body when present. */
export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      `Could not reach the API at ${API_BASE_URL}. Is the backend running?`,
    );
  }

  const contentType = res.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await res.json() : undefined;

  if (!res.ok) {
    const errBody = body as ApiErrorBody | undefined;
    throw new ApiRequestError(
      res.status,
      errBody?.error?.code ?? 'UNKNOWN_ERROR',
      errBody?.error?.message ?? res.statusText,
      errBody?.error?.details,
    );
  }

  return body as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, data: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(data) });
}
