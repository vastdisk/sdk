import { HttpClient } from './http/request.js'
import { AccountModule } from './modules/account.js'
import { AuditModule } from './modules/audit.js'
import { AuthModule } from './modules/auth.js'
import { FilesModule } from './modules/files.js'
import { KeysModule } from './modules/keys.js'
import { SharesModule } from './modules/shares.js'
import { UploadsModule } from './modules/uploads.js'
import type { AuthState, VastDiskClientOptions } from './types.js'

export class VastDiskClient {
  readonly auth: AuthModule
  readonly account: AccountModule
  readonly files: FilesModule
  readonly uploads: UploadsModule
  readonly shares: SharesModule
  readonly keys: KeysModule
  readonly audit: AuditModule

  private readonly http: HttpClient

  constructor(options: VastDiskClientOptions) {
    this.http = new HttpClient(options)
    this.auth = new AuthModule(this.http)
    this.account = new AccountModule(this.http)
    this.files = new FilesModule(this.http)
    this.uploads = new UploadsModule(this.http)
    this.shares = new SharesModule(this.http)
    this.keys = new KeysModule(this.http)
    this.audit = new AuditModule(this.http)
  }

  setAccessToken(token: string | null): void {
    this.http.setAccessToken(token)
  }

  setApiKey(key: string | null): void {
    this.http.setApiKey(key)
  }

  getAuthState(): AuthState {
    return this.http.getAuthState()
  }
}

