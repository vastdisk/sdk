# @vastdisk/sdk

Lightweight JavaScript and TypeScript SDK for VastDisk.

## Current Scope

This first scaffold includes:

- typed HTTP client
- auth/files/uploads/shares/keys/account/audit modules
- browser and Node entrypoints
- isolated crypto surface for future zero-knowledge helpers

## Example

```ts
import { VastDiskClient } from '@vastdisk/sdk'

const client = new VastDiskClient({
  baseUrl: 'https://api.vastdisk.com',
  apiKey: process.env.VASTDISK_API_KEY,
})

const files = await client.files.list()
```

