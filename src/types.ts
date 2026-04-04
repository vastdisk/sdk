export type AuthState = {
  accessToken: string | null
  apiKey: string | null
}

export type Session = {
  accessToken: string
  accountId: string
  expiresInSeconds: number
  requires2fa: boolean
  loginTicket?: string
  isNewUser: boolean
}

export type CurrentUser = {
  id: string
  accountId: string
  tier: string
  tierName: string
  createdAt: number
  role: string
  avatarColor: string
  badgeColor?: string | null
  twoFactorEnabled: boolean
  activeFiles: number
  spaceUsed: number
  credits: number
  creditsAllTime: number
  kdfSalt: string
  publicKey: string
  tierExpiresAt: number
  onboardingCompleted: boolean
  serverTime: number
  serverVersion: string
  accountDisabled: boolean
}

export type RegisterPrepareResponse = {
  accountId: string
  totpSecret: string
  qrCode: string
}

export type RegisterCompleteInput = {
  accountId: string
  totpSecret: string
  code: string
  deviceId: string
  cfTurnstileToken?: string
}

export type LoginStartInput = {
  accountId: string
}

export type LoginStartResponse = {
  requires2fa: boolean
  loginTicket: string
}

export type LoginVerifyInput = {
  accountId: string
  code: string
  loginTicket: string
  deviceId: string
}

export type UpdateAccountInput = Record<string, unknown>

export type UploadInitInput = {
  filename: string
  mimeType?: string
  expiresInSeconds?: number
  autoDestructEnabled?: boolean
  autoDestructSeconds?: number
  linkEnabled?: boolean
  linkExpiresInSeconds?: number
  serverCompression?: boolean
  cfTurnstileToken?: string
  parentId?: string
}

export type UploadSession = {
  uploadId: string
  offset: number
  resumeExpiresAtUnix: number
}

export type UploadStatus = UploadSession

export type UploadFinishInput = {
  wrappedFileKey?: string
  ciphertextHash?: string
  signature?: string
  compression?: string
}

export type UploadResult = {
  id: string
  expiresAtUnix: number
  downloadUrl: string
}

export type UploadProgress = {
  phase: 'uploading' | 'finishing'
  bytesSent: number
  totalBytes: number
  percent: number
}

export type UploadFileInput = {
  file?: Blob
  data?: Uint8Array | ArrayBuffer
  filename: string
  mimeType?: string
  expiresInSeconds?: number
  parentId?: string
  onProgress?: (progress: UploadProgress) => void
  signal?: AbortSignal
  chunkSizeBytes?: number
  finish?: UploadFinishInput
}

export type UserFile = {
  id: string
  filename: string
  size: number
  storedSize: number
  expiresAt: number
  downloads: number
  maxDownloads?: number | null
  mimeType?: string | null
  createdAt: number
  encryptionKey?: string | null
  wrappedFileKey?: string | null
  ciphertextHash?: string | null
  signature?: string | null
  compression?: string | null
  autoDestructEnabled: boolean
  autoDestructSeconds?: number | null
  linkEnabled: boolean
  linkExpiresAt?: number | null
  shareLinkId?: string | null
  parentId?: string | null
  versionCount: number
}

export type DownloadMeta = {
  id: string
  filename: string
  size: number
  mimeType?: string | null
  wrappedFileKey?: string | null
  ciphertextHash?: string | null
  signature?: string | null
  compression?: string | null
  uploaderPublicKey?: string | null
}

export type ShareLink = {
  id: string
  fileId: string
  name?: string | null
  expiresAt?: number | null
  maxDownloads?: number | null
  downloads: number
  createdAt?: number
}

export type CreateShareLinkInput = {
  expiresAt?: number | null
  expiresInSeconds?: number | null
  maxDownloads?: number | null
}

export type FolderShare = {
  id: string
  folderName: string
  createdAt: number
  createdBy?: string | null
}

export type CreateFolderShareInput = {
  folderName: string
  files: Array<{
    id: string
    relativePath: string
  }>
}

export type ApiKeyRecord = {
  id: string
  name: string
  createdAt: number
  lastUsedAt?: number | null
}

export type CreateApiKeyResult = {
  apiKey: string
  metadata: ApiKeyRecord
}

export type AuditLogEntry = {
  id: string
  eventType: string
  description: string
  ipAddress?: string | null
  metadata?: string | null
  createdAt: number
}

export type ListAuditLogsInput = Record<string, string | number | boolean | undefined | null>

export type VastDiskClientOptions = {
  baseUrl: string
  apiKey?: string
  accessToken?: string
  fetch?: typeof globalThis.fetch
  autoRefresh?: boolean
  userAgent?: string
  onAuthChange?: (auth: AuthState) => void
}

export type RequestOptions = {
  method?: string
  headers?: HeadersInit
  body?: BodyInit | null
  query?: Record<string, string | number | boolean | undefined | null>
  auth?: 'auto' | 'required' | 'none'
  retryOnAuth?: boolean
  signal?: AbortSignal
}

export type BrowserCryptoModule = {
  encryptFile(_file: Blob): Promise<never>
  decryptFile(_blob: Blob, _key: Uint8Array): Promise<never>
}
