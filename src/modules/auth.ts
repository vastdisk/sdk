import type {
  LoginStartInput,
  LoginStartResponse,
  LoginVerifyInput,
  RegisterCompleteInput,
  RegisterPrepareResponse,
  Session,
} from '../types.js'
import { HttpClient } from '../http/request.js'

export class AuthModule {
  constructor(private readonly http: HttpClient) {}

  registerPrepare(): Promise<RegisterPrepareResponse> {
    return this.http.request<Record<string, unknown>>('/register/prepare', {
      method: 'POST',
      auth: 'none',
    }).then(mapRegisterPrepareResponse)
  }

  async registerComplete(input: RegisterCompleteInput): Promise<Session> {
    const session = await this.http.request<Record<string, unknown>>('/register/create', {
      method: 'POST',
      auth: 'none',
      body: jsonBody({
        account_id: input.accountId,
        totp_secret: input.totpSecret,
        code: input.code,
        device_id: input.deviceId,
        cf_turnstile_token: input.cfTurnstileToken,
      }),
      headers: jsonHeaders(),
      retryOnAuth: false,
    })
    const mapped = mapSession(session)
    this.http.setAccessToken(mapped.accessToken)
    return mapped
  }

  loginStart(input: LoginStartInput): Promise<LoginStartResponse> {
    return this.http.request<Record<string, unknown>>('/login', {
      method: 'POST',
      auth: 'none',
      body: jsonBody({
        account_id: input.accountId,
      }),
      headers: jsonHeaders(),
      retryOnAuth: false,
    }).then(mapLoginStartResponse)
  }

  async loginVerify(input: LoginVerifyInput): Promise<Session> {
    const session = await this.http.request<Record<string, unknown>>('/login/2fa', {
      method: 'POST',
      auth: 'none',
      body: jsonBody({
        account_id: input.accountId,
        code: input.code,
        login_ticket: input.loginTicket,
        device_id: input.deviceId,
      }),
      headers: jsonHeaders(),
      retryOnAuth: false,
    })
    const mapped = mapSession(session)
    this.http.setAccessToken(mapped.accessToken)
    return mapped
  }

  async refresh(): Promise<Session> {
    const session = await this.http.request<Record<string, unknown>>('/auth/session/refresh', {
      method: 'POST',
      auth: 'none',
      retryOnAuth: false,
    })
    const mapped = mapSession(session)
    this.http.setAccessToken(mapped.accessToken)
    return mapped
  }

  async logout(): Promise<void> {
    await this.http.requestVoid('/auth/session/logout', {
      method: 'POST',
      auth: 'none',
      retryOnAuth: false,
    })
    this.http.setAccessToken(null)
  }

  setAccessToken(token: string | null): void {
    this.http.setAccessToken(token)
  }

  getAccessToken(): string | null {
    return this.http.getAuthState().accessToken
  }
}

function jsonHeaders(): HeadersInit {
  return {
    'content-type': 'application/json',
  }
}

function jsonBody(value: unknown): string {
  return JSON.stringify(value)
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

function mapRegisterPrepareResponse(input: Record<string, unknown>): RegisterPrepareResponse {
  return {
    accountId: String(input.account_id ?? ''),
    totpSecret: String(input.totp_secret ?? ''),
    qrCode: String(input.qr_code ?? ''),
  }
}

function mapLoginStartResponse(input: Record<string, unknown>): LoginStartResponse {
  return {
    requires2fa: Boolean(input.requires_2fa),
    loginTicket: String(input.login_ticket ?? ''),
  }
}
