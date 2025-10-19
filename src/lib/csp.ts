import { headers } from 'next/headers'

export async function getCspNonce(): Promise<string | null> {
  try {
    const h = await headers()
    const nonce = h.get('x-nonce')
    return nonce ? String(nonce) : null
  } catch {
    return null
  }
}

export function createRandomNonce(): string {
  // Web Crypto is available in both edge and node runtimes
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // base64-url-like encoding without padding
  const b64 = Buffer.from(bytes).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}