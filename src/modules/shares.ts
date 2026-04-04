import { HttpClient } from '../http/request.js'
import type { CreateFolderShareInput, CreateShareLinkInput, FolderShare, ShareLink } from '../types.js'

export class SharesModule {
  constructor(private readonly http: HttpClient) {}

  list(fileId: string): Promise<ShareLink[]> {
    return this.http.request<Record<string, unknown>[]>(`/auth/files/${fileId}/links`, {
      method: 'GET',
      auth: 'required',
    }).then((items) => items.map(mapShareLink))
  }

  create(fileId: string, input: CreateShareLinkInput = {}): Promise<ShareLink> {
    return this.http.request<Record<string, unknown>>(`/auth/files/${fileId}/links`, {
      method: 'POST',
      auth: 'required',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: null,
        expires_in_seconds: input.expiresInSeconds,
        max_downloads: input.maxDownloads,
      }),
    }).then(mapShareLink)
  }

  delete(linkId: string): Promise<void> {
    return this.http.requestVoid(`/auth/links/${linkId}`, {
      method: 'DELETE',
      auth: 'required',
    })
  }

  createFolder(input: CreateFolderShareInput): Promise<FolderShare> {
    return this.http.request<Record<string, unknown>>('/auth/folder-shares', {
      method: 'POST',
      auth: 'required',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        folder_name: input.folderName,
        files: input.files.map((file) => ({
          id: file.id,
          relative_path: file.relativePath,
        })),
      }),
    }).then(mapFolderShare)
  }

  deleteFolder(folderShareId: string): Promise<void> {
    return this.http.requestVoid(`/auth/folder-shares/${folderShareId}`, {
      method: 'DELETE',
      auth: 'required',
    })
  }
}

function mapShareLink(input: Record<string, unknown>): ShareLink {
  return {
    id: String(input.id ?? ''),
    fileId: String(input.file_id ?? ''),
    name: typeof input.name === 'string' ? input.name : null,
    expiresAt: typeof input.expires_at === 'number' ? input.expires_at : null,
    maxDownloads: typeof input.max_downloads === 'number' ? input.max_downloads : null,
    downloads: Number(input.downloads ?? 0),
    createdAt: Number(input.created_at ?? 0),
  }
}

function mapFolderShare(input: Record<string, unknown>): FolderShare {
  return {
    id: String(input.id ?? ''),
    folderName: String(input.folder_name ?? ''),
    createdAt: Number(input.created_at ?? 0),
    createdBy: typeof input.created_by === 'string' ? input.created_by : null,
  }
}
