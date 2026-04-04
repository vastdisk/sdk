export type VastDiskErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'UPLOAD_OFFSET_MISMATCH'
  | 'INVALID_SIGNATURE'
  | 'DECRYPTION_FAILED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export type VastDiskErrorOptions = {
  code: VastDiskErrorCode
  message: string
  status?: number
  requestId?: string
  details?: unknown
  cause?: unknown
}

export class VastDiskError extends Error {
  readonly code: VastDiskErrorCode
  readonly status?: number
  readonly requestId?: string
  readonly details?: unknown

  constructor(options: VastDiskErrorOptions) {
    super(options.message)
    this.name = 'VastDiskError'
    this.code = options.code
    this.status = options.status
    this.requestId = options.requestId
    this.details = options.details

    if ('cause' in Error.prototype && options.cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = options.cause
    }
  }
}

export function errorCodeFromStatus(status?: number): VastDiskErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT'
    case 429:
      return 'RATE_LIMITED'
    default:
      return 'UNKNOWN_ERROR'
  }
}

