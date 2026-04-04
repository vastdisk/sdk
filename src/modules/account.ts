import { HttpClient } from '../http/request.js'
import type { CurrentUser, UpdateAccountInput } from '../types.js'

export class AccountModule {
  constructor(private readonly http: HttpClient) {}

  me(): Promise<CurrentUser> {
    return this.http.request<Record<string, unknown>>('/auth/me', {
      method: 'GET',
      auth: 'required',
    }).then(mapCurrentUser)
  }

  update(input: UpdateAccountInput): Promise<CurrentUser> {
    return this.http.request<Record<string, unknown>>('/auth/me', {
      method: 'PUT',
      auth: 'required',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    }).then(mapCurrentUser)
  }

  delete(): Promise<void> {
    return this.http.requestVoid('/auth/me', {
      method: 'DELETE',
      auth: 'required',
    })
  }
}

function mapCurrentUser(input: Record<string, unknown>): CurrentUser {
  return {
    id: String(input.id ?? ''),
    accountId: String(input.account_id ?? ''),
    tier: String(input.tier ?? ''),
    tierName: String(input.tier_name ?? ''),
    createdAt: Number(input.created_at ?? 0),
    role: String(input.role ?? ''),
    avatarColor: String(input.avatar_color ?? ''),
    badgeColor: typeof input.badge_color === 'string' ? input.badge_color : null,
    twoFactorEnabled: Boolean(input.two_factor_enabled),
    activeFiles: Number(input.active_files ?? 0),
    spaceUsed: Number(input.space_used ?? 0),
    credits: Number(input.credits ?? 0),
    creditsAllTime: Number(input.credits_all_time ?? 0),
    kdfSalt: String(input.kdf_salt ?? ''),
    publicKey: String(input.public_key ?? ''),
    tierExpiresAt: Number(input.tier_expires_at ?? 0),
    onboardingCompleted: Boolean(input.onboarding_completed),
    serverTime: Number(input.server_time ?? 0),
    serverVersion: String(input.server_version ?? ''),
    accountDisabled: Boolean(input.account_disabled),
  }
}
