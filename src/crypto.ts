import { VastDiskError } from './errors.js'
import type { BrowserCryptoModule } from './types.js'

function notImplemented(name: string): Promise<never> {
  return Promise.reject(
    new VastDiskError({
      code: 'UNKNOWN_ERROR',
      message: `${name} is not implemented yet in this SDK build`,
    }),
  )
}

export const cryptoClient: BrowserCryptoModule = {
  encryptFile(_file) {
    return notImplemented('cryptoClient.encryptFile')
  },
  decryptFile(_blob, _key) {
    return notImplemented('cryptoClient.decryptFile')
  },
}

