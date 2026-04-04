import { HttpClient } from '../http/request.js'
import type { ApiKeyRecord, CreateApiKeyResult } from '../types.js'

export class KeysModule {
  constructor(private readonly http: HttpClient) {}

  list(): Promise<ApiKeyRecord[]> {
    return this.http.request<Record<string, unknown>[]>('/auth/api-keys', {
      method: 'GET',
      auth: 'required',
    }).then((items) => items.map(mapApiKeyRecord))
  }

  create(input: { name: string }): Promise<CreateApiKeyResult> {
    return this.http.request<Record<string, unknown>>('/auth/api-keys', {
      method: 'POST',
      auth: 'required',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    }).then(mapCreateApiKeyResult)
  }

  revoke(id: string): Promise<void> {
    return this.http.requestVoid(`/auth/api-keys/${id}`, {
      method: 'DELETE',
      auth: 'required',
    })
  }
}

function mapApiKeyRecord(input: Record<string, unknown>): ApiKeyRecord {
  return {
    id: String(input.id ?? ''),
    name: String(input.name ?? ''),
    createdAt: Number(input.created_at ?? 0),
    lastUsedAt: typeof input.last_used_at === 'number' ? input.last_used_at : null,
  }
}

function mapCreateApiKeyResult(input: Record<string, unknown>): CreateApiKeyResult {
  const metadata = input.metadata
  return {
    apiKey: String(input.api_key ?? ''),
    metadata:
      metadata && typeof metadata === 'object'
        ? mapApiKeyRecord(metadata as Record<string, unknown>)
        : {
            id: '',
            name: '',
            createdAt: 0,
            lastUsedAt: null,
          },
  }
}
