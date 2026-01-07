import { verifyToken } from '../utils/jwt'

declare module 'h3' {
  interface H3EventContext {
    auth?: {
      userId: number
      email: string
      role: string
    }
  }
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (token && event.context.cloudflare?.env?.JWT_SECRET) {
    const jwtSecret = event.context.cloudflare.env.JWT_SECRET
    const payload = await verifyToken(token, jwtSecret)

    if (payload) {
      event.context.auth = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      }
    }
  }
})
