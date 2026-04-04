import { VastDiskError, errorCodeFromStatus } from '../errors.js'
import type { AuthState, RequestOptions, Session, VastDiskClientOptions } from '../types.js'

type HttpClientState = {
  accessToken: string | null
  apiKey: string | null
}

export class HttpClient {
  private readonly baseUrl: string
  private readonly fetchImpl: typeof globalThis.fetch
  private readonly autoRefresh: boolean
  private readonly userAgent?: string
  private readonly onAuthChange?: (auth: AuthState) => void
  private readonly refreshPath = '/auth/session/refresh'
  private readonly state: HttpClientState
  private refreshPromise: Promise<Session> | null = null

  constructor(options: VastDiskClientOptions) {
    if (!options.baseUrl.trim()) {
      throw new VastDiskError({
        code: 'BAD_REQUEST',
        message: 'baseUrl is required',
      })
    }

    const fetchImpl = options.fetch ?? globalThis.fetch
    if (typeof fetchImpl !== 'function') {
      throw new VastDiskError({
        code: 'BAD_REQUEST',
        message: 'A fetch implementation is required in this runtime',
      })
    }

    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.fetchImpl = fetchImpl
    this.autoRefresh = options.autoRefresh ?? false
    this.userAgent = options.userAgent
    this.onAuthChange = options.onAuthChange
    this.state = {
      accessToken: options.accessToken ?? null,
      apiKey: options.apiKey ?? null,
    }
  }

  getAuthState(): AuthState {
    return {
      accessToken: this.state.accessToken,
      apiKey: this.state.apiKey,
    }
  }

  setAccessToken(accessToken: string | null): void {
    this.state.accessToken = accessToken
    this.emitAuthChange()
  }

  setApiKey(apiKey: string | null): void {
    this.state.apiKey = apiKey
    this.emitAuthChange()
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return this.performRequest<T>(path, options, true)
  }

  async requestVoid(path: string, options: RequestOptions = {}): Promise<void> {
    await this.performRequest<unknown>(path, options, true)
  }

  async download(path: string, options: RequestOptions = {}): Promise<Response> {
    const url = this.buildUrl(path, options.query)
    const headers = this.buildHeaders(options.headers, options.auth ?? 'auto')

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body ?? null,
        signal: options.signal,
        credentials: 'include',
      })
    } catch (cause) {
      throw new VastDiskError({
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        cause,
      })
    }

    if (!response.ok) {
      throw await this.buildError(response)
    }

    return response
  }

  private async performRequest<T>(
    path: string,
    options: RequestOptions,
    allowRefreshRetry: boolean,
  ): Promise<T> {
    const url = this.buildUrl(path, options.query)
    const headers = this.buildHeaders(options.headers, options.auth ?? 'auto')

    let response: Response
    try {
      response = await this.fetchImpl(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body ?? null,
        signal: options.signal,
        credentials: 'include',
      })
    } catch (cause) {
      throw new VastDiskError({
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        cause,
      })
    }

    if (
      response.status === 401 &&
      allowRefreshRetry &&
      (options.retryOnAuth ?? true) &&
      this.autoRefresh &&
      !this.state.apiKey &&
      this.state.accessToken
    ) {
      await this.refreshSession()
      return this.performRequest<T>(path, options, false)
    }

    if (!response.ok) {
      throw await this.buildError(response)
    }

    if (response.status === 204) {
      return undefined as T
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return (await response.json()) as T
    }

    return (await response.text()) as T
  }

  async refreshSession(): Promise<Session> {
    if (!this.autoRefresh) {
      throw new VastDiskError({
        code: 'UNAUTHORIZED',
        message: 'Automatic session refresh is disabled',
        status: 401,
      })
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.performRequest<Record<string, unknown>>(
        this.refreshPath,
        {
          method: 'POST',
          auth: 'none',
          retryOnAuth: false,
        },
        false,
      )
        .then((session) => {
          const mapped = mapSession(session)
          this.setAccessToken(mapped.accessToken)
          return mapped
        })
        .finally(() => {
          this.refreshPromise = null
        })
    }

    return this.refreshPromise
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined | null>,
  ): string {
    const resolvedPath = path.startsWith('/') ? path : `/${path}`
    const url = new URL(`${this.baseUrl}${resolvedPath}`)
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) continue
        url.searchParams.set(key, String(value))
      }
    }
    return url.toString()
  }

  private buildHeaders(input: HeadersInit | undefined, authMode: 'auto' | 'required' | 'none'): Headers {
    const headers = new Headers(input)

    if (!headers.has('accept')) {
      headers.set('accept', 'application/json')
    }
    if (this.userAgent && !headers.has('x-vastdisk-user-agent')) {
      headers.set('x-vastdisk-user-agent', this.userAgent)
    }

    if (authMode === 'none') {
      return headers
    }

    const token = this.state.apiKey ?? this.state.accessToken
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
      return headers
    }

    if (authMode === 'required') {
      throw new VastDiskError({
        code: 'UNAUTHORIZED',
        message: 'This request requires authentication',
        status: 401,
      })
    }

    return headers
  }

  private async buildError(response: Response): Promise<VastDiskError> {
    const requestId = response.headers.get('x-request-id') ?? undefined
    const contentType = response.headers.get('content-type') ?? ''
    let details: unknown
    let message = `Request failed with status ${response.status}`

    try {
      if (contentType.includes('application/json')) {
        details = await response.json()
        if (details && typeof details === 'object' && 'error' in details && typeof details.error === 'string') {
          message = details.error
        }
      } else {
        const text = await response.text()
        if (text.trim()) {
          details = text
          message = text
        }
      }
    } catch {
      // Ignore parse errors and fall back to generic status handling.
    }

    return new VastDiskError({
      code: errorCodeFromStatus(response.status),
      message,
      status: response.status,
      requestId,
      details,
    })
  }

  private emitAuthChange(): void {
    this.onAuthChange?.(this.getAuthState())
  }
}

function mapSession(input: Record<string, unknown>): Session {
  return {
    accessToken: String(input.access_token ?? ''),
    accountId: String(input.account_id ?? ''),
    expiresInSeconds: Number(input.expires_in_seconds ?? 0),
    requires2fa: Boolean(input.requires_2fa),
    loginTicket: typeof input.login_ticket === 'string' ? input.login_ticket : undefined,
    isNewUser: Boolean(input.is_new_user),
  }
}
