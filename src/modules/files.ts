import { VastDiskError } from '../errors.js'
import { HttpClient } from '../http/request.js'
import type { DownloadMeta, UserFile } from '../types.js'

export class FilesModule {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<UserFile[]> {
    return this.http.request<Record<string, unknown>[]>('/auth/files', {
      method: 'GET',
      auth: 'required',
    }).then((items) => items.map(mapUserFile))
  }

  async get(fileId: string): Promise<UserFile> {
    const files = await this.list()
    const file = files.find((item) => item.id === fileId)
    if (!file) {
      throw new VastDiskError({
        code: 'NOT_FOUND',
        message: `File ${fileId} was not found`,
        status: 404,
      })
    }
    return file
  }

  delete(fileId: string): Promise<void> {
    return this.http.requestVoid(`/auth/files/${fileId}`, {
      method: 'DELETE',
      auth: 'required',
    })
  }

  deleteAll(): Promise<void> {
    return this.http.requestVoid('/auth/files/all', {
      method: 'DELETE',
      auth: 'required',
    })
  }

  versions(fileId: string): Promise<UserFile[]> {
    return this.http.request<Record<string, unknown>[]>(`/auth/files/${fileId}/versions`, {
      method: 'GET',
      auth: 'required',
    }).then((items) => items.map(mapUserFile))
  }

  downloadMeta(fileId: string): Promise<DownloadMeta> {
    return this.http.request<Record<string, unknown>>(`/download/${fileId}/meta`, {
      method: 'GET',
      auth: 'none',
    }).then(mapDownloadMeta)
  }

  publicDownloadMeta(linkId: string): Promise<DownloadMeta> {
    return this.http.request<Record<string, unknown>>(`/share/${linkId}/meta`, {
      method: 'GET',
      auth: 'none',
    }).then(mapDownloadMeta)
  }

  async downloadRaw(fileId: string, signal?: AbortSignal): Promise<Blob> {
    const response = await this.http.download(`/download/${fileId}`, {
      method: 'GET',
      auth: 'none',
      query: { raw: 1 },
      signal,
    })
    return response.blob()
  }

  async downloadPublicRaw(linkId: string, signal?: AbortSignal): Promise<Blob> {
    const response = await this.http.download(`/share/${linkId}`, {
      method: 'GET',
      auth: 'none',
      query: { raw: 1 },
      signal,
    })
    return response.blob()
  }
}

function mapUserFile(input: Record<string, unknown>): UserFile {
  return {
    id: String(input.id ?? ''),
    filename: String(input.filename ?? ''),
    size: Number(input.size ?? 0),
    storedSize: Number(input.stored_size ?? 0),
    expiresAt: Number(input.expires_at ?? 0),
    downloads: Number(input.downloads ?? 0),
    maxDownloads: numberOrNull(input.max_downloads),
    mimeType: stringOrNull(input.mime_type),
    createdAt: Number(input.created_at ?? 0),
    encryptionKey: stringOrNull(input.encryption_key),
    wrappedFileKey: stringOrNull(input.wrapped_file_key),
    ciphertextHash: stringOrNull(input.ciphertext_hash),
    signature: stringOrNull(input.signature),
    compression: stringOrNull(input.compression),
    autoDestructEnabled: Boolean(input.auto_destruct_enabled),
    autoDestructSeconds: numberOrNull(input.auto_destruct_seconds),
    linkEnabled: Boolean(input.link_enabled),
    linkExpiresAt: numberOrNull(input.link_expires_at),
    shareLinkId: stringOrNull(input.share_link_id),
    parentId: stringOrNull(input.parent_id),
    versionCount: Number(input.version_count ?? 0),
  }
}

function mapDownloadMeta(input: Record<string, unknown>): DownloadMeta {
  return {
    id: String(input.id ?? ''),
    filename: String(input.filename ?? ''),
    size: Number(input.size ?? 0),
    mimeType: stringOrNull(input.mime_type),
    wrappedFileKey: stringOrNull(input.wrapped_file_key),
    ciphertextHash: stringOrNull(input.ciphertext_hash),
    signature: stringOrNull(input.signature),
    compression: stringOrNull(input.compression),
    uploaderPublicKey: stringOrNull(input.uploader_public_key),
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null
}
