const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/+$/, '')

export class ApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
}

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined

  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('tbo_csrf='))

  return cookie ? decodeURIComponent(cookie.slice('tbo_csrf='.length)) : undefined
}

function getRequestHeaders(
  headers: HeadersInit | undefined,
  method: string,
  hasJsonBody: boolean,
): Headers {
  const result = new Headers(headers)
  result.set('Accept', 'application/json')

  if (hasJsonBody) {
    result.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrfToken = getCsrfToken()
    if (csrfToken) {
      result.set('X-CSRF-Token', csrfToken)
    }
  }

  return result
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...requestOptions } = options
  const method = requestOptions.method ?? 'GET'

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    method,
    credentials: 'include',
    headers: getRequestHeaders(headers, method, body !== undefined),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`
    try {
      const payload = await response.json() as { detail?: string }
      if (payload.detail) message = payload.detail
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: getRequestHeaders(undefined, 'POST', false),
    body: formData,
  })

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`
    try {
      const payload = await response.json() as { detail?: string }
      if (payload.detail) message = payload.detail
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new ApiError(message, response.status)
  }

  return response.json() as Promise<T>
}
