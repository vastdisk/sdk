import { HttpClient } from '../http/request.js'
import type { AuditLogEntry, ListAuditLogsInput } from '../types.js'

export class AuditModule {
  constructor(private readonly http: HttpClient) {}

  list(input: ListAuditLogsInput = {}): Promise<AuditLogEntry[]> {
    return this.http.request<Record<string, unknown>[]>('/auth/audit-logs', {
      method: 'GET',
      auth: 'required',
      query: input,
    }).then((items) => items.map(mapAuditLogEntry))
  }
}

function mapAuditLogEntry(input: Record<string, unknown>): AuditLogEntry {
  return {
    id: String(input.id ?? ''),
    eventType: String(input.event_type ?? ''),
    description: String(input.description ?? ''),
    ipAddress: typeof input.ip_address === 'string' ? input.ip_address : null,
    metadata: typeof input.metadata === 'string' ? input.metadata : null,
    createdAt: Number(input.created_at ?? 0),
  }
}
