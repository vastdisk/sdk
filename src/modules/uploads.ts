import { VastDiskError } from '../errors.js'
import { HttpClient } from '../http/request.js'
import type {
  UploadFileInput,
  UploadFinishInput,
  UploadProgress,
  UploadResult,
  UploadSession,
  UploadStatus,
} from '../types.js'

const DEFAULT_CHUNK_SIZE_BYTES = 8 * 1024 * 1024

export class UploadsModule {
  constructor(private readonly http: HttpClient) {}

  init(input: {
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
  }): Promise<UploadSession> {
    return this.http.request<Record<string, unknown>>('/upload/init', {
      method: 'POST',
      auth: 'auto',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        filename: input.filename,
        mime_type: input.mimeType,
        expires_in_seconds: input.expiresInSeconds,
        auto_destruct_enabled: input.autoDestructEnabled,
        auto_destruct_seconds: input.autoDestructSeconds,
        link_enabled: input.linkEnabled,
        link_expires_in_seconds: input.linkExpiresInSeconds,
        server_compression: input.serverCompression,
        cf_turnstile_token: input.cfTurnstileToken,
        parent_id: input.parentId,
      }),
    }).then(mapUploadSession)
  }

  status(uploadId: string): Promise<UploadStatus> {
    return this.http.request<Record<string, unknown>>(`/upload/${uploadId}/status`, {
      method: 'GET',
      auth: 'auto',
    }).then(mapUploadSession)
  }

  async sendChunk(uploadId: string, chunk: Blob | Uint8Array, offset: number, signal?: AbortSignal): Promise<void> {
    const body = chunk instanceof Blob ? chunk : new Blob([toArrayBuffer(chunk)])
    await this.http.requestVoid(`/upload/${uploadId}/chunk`, {
      method: 'PUT',
      auth: 'auto',
      signal,
      body,
      headers: {
        'content-type': 'application/octet-stream',
        'x-upload-offset': String(offset),
      },
    })
  }

  finish(uploadId: string, input: UploadFinishInput = {}): Promise<UploadResult> {
    return this.http.request<Record<string, unknown>>(`/upload/${uploadId}/finish`, {
      method: 'POST',
      auth: 'auto',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        wrapped_file_key: input.wrappedFileKey,
        ciphertext_hash: input.ciphertextHash,
        signature: input.signature,
        compression: input.compression,
      }),
    }).then(mapUploadResult)
  }

  cancel(uploadId: string): Promise<void> {
    return this.http.requestVoid(`/upload/${uploadId}/cancel`, {
      method: 'DELETE',
      auth: 'auto',
    })
  }

  async uploadFile(input: UploadFileInput): Promise<UploadResult> {
    const blob = toBlob(input)
    const chunkSize = input.chunkSizeBytes ?? DEFAULT_CHUNK_SIZE_BYTES
    const session = await this.init({
      filename: input.filename,
      mimeType: input.mimeType ?? inferMimeType(blob),
      expiresInSeconds: input.expiresInSeconds,
      autoDestructEnabled: input.autoDestructEnabled,
      autoDestructSeconds: input.autoDestructSeconds,
      linkEnabled: input.linkEnabled,
      linkExpiresInSeconds: input.linkExpiresInSeconds,
      serverCompression: input.serverCompression,
      cfTurnstileToken: input.cfTurnstileToken,
      parentId: input.parentId,
    })

    let bytesSent = session.offset
    if (bytesSent > blob.size) {
      throw new VastDiskError({
        code: 'UPLOAD_OFFSET_MISMATCH',
        message: 'Server upload offset is larger than the file size',
      })
    }

    input.onProgress?.(progressState('uploading', bytesSent, blob.size))

    while (bytesSent < blob.size) {
      const end = Math.min(bytesSent + chunkSize, blob.size)
      const chunk = blob.slice(bytesSent, end)
      await this.sendChunk(session.uploadId, chunk, bytesSent, input.signal)
      bytesSent = end
      input.onProgress?.(progressState('uploading', bytesSent, blob.size))
    }

    input.onProgress?.(progressState('finishing', blob.size, blob.size))
    return this.finish(session.uploadId, input.finish)
  }
}

function toBlob(input: UploadFileInput): Blob {
  if (input.file) {
    return input.file
  }
  if (input.data instanceof Uint8Array) {
    return new Blob([toArrayBuffer(input.data)], { type: input.mimeType })
  }
  if (input.data instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(input.data)], { type: input.mimeType })
  }
  throw new VastDiskError({
    code: 'BAD_REQUEST',
    message: 'uploadFile requires either file or data',
  })
}

function progressState(
  phase: UploadProgress['phase'],
  bytesSent: number,
  totalBytes: number,
): UploadProgress {
  return {
    phase,
    bytesSent,
    totalBytes,
    percent: totalBytes === 0 ? 100 : Math.round((bytesSent / totalBytes) * 100),
  }
}

function inferMimeType(blob: Blob): string | undefined {
  return blob.type || undefined
}

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer
}

function mapUploadSession(input: Record<string, unknown>): UploadSession {
  return {
    uploadId: String(input.upload_id ?? ''),
    offset: Number(input.offset ?? 0),
    resumeExpiresAtUnix: Number(input.resume_expires_at_unix ?? 0),
  }
}

function mapUploadResult(input: Record<string, unknown>): UploadResult {
  return {
    id: String(input.id ?? ''),
    expiresAtUnix: Number(input.expires_at_unix ?? 0),
    downloadUrl: String(input.download_url ?? ''),
  }
}
