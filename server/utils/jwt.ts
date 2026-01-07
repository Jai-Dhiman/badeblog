interface JWTPayload {
  userId: number
  email: string
  role: string
  exp: number
  iat: number
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

async function getKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function base64UrlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlDecode(str: string): Uint8Array {
  const padded = str + '='.repeat((4 - (str.length % 4)) % 4)
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function createToken(
  payload: Omit<JWTPayload, 'exp' | 'iat'>,
  secret: string,
  expiresInHours = 24 * 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInHours * 3600,
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)))
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(fullPayload)))
  const message = `${headerB64}.${payloadB64}`

  const key = await getKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const signatureB64 = base64UrlEncode(new Uint8Array(signature))

  return `${message}.${signatureB64}`
}

export async function verifyToken(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerB64, payloadB64, signatureB64] = parts
    const message = `${headerB64}.${payloadB64}`

    const key = await getKey(secret)
    const signatureData = base64UrlDecode(signatureB64)
    const valid = await crypto.subtle.verify('HMAC', key, signatureData, encoder.encode(message))

    if (!valid) return null

    const payloadJson = decoder.decode(base64UrlDecode(payloadB64))
    const payload: JWTPayload = JSON.parse(payloadJson)

    if (payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}
