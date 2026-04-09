# @vastdisk/sdk

Lightweight JavaScript and TypeScript SDK for VastDisk.

## Current Scope

This SDK currently covers:

- typed HTTP client
- auth/files/uploads/shares/keys/account/audit modules
- browser and Node entrypoints
- upload helpers for the current API
- placeholder crypto surface for future zero-knowledge helpers

## Install

```bash
npm install @vastdisk/sdk
```

## Login Example

```ts
import { VastDiskClient } from '@vastdisk/sdk'

const client = new VastDiskClient({
  baseUrl: 'https://api.vastdisk.com',
  autoRefresh: true,
})

const login = await client.auth.loginStart({
  accountId: '1234-5678-9012-3456',
})

const session = await client.auth.loginVerify({
  accountId: '1234-5678-9012-3456',
  code: '123456',
  loginTicket: login.loginTicket,
  deviceId: 'my-device-id',
})

const files = await client.files.list()
console.log(session.accountId, files.length)
```

## Registration Example

```ts
import { VastDiskClient } from '@vastdisk/sdk'

const client = new VastDiskClient({
  baseUrl: 'https://api.vastdisk.com',
})

const prepared = await client.auth.registerPrepare()

console.log(prepared.accountId)
console.log(prepared.totpSecret)
console.log(prepared.qrCode)
```

## Notes

- Auth is currently `account_id + TOTP`.
- Session refresh uses the server refresh cookie when `autoRefresh` is enabled.
- `cryptoClient` is still a placeholder in this SDK build.
```
