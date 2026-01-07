import { verifyToken } from '../../utils/jwt'

interface User {
  id: number
  email: string
  name: string
  role: string
}

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth_token')

  if (!token) {
    return { user: null }
  }

  const jwtSecret = event.context.cloudflare.env.JWT_SECRET
  const payload = await verifyToken(token, jwtSecret)

  if (!payload) {
    deleteCookie(event, 'auth_token', { path: '/' })
    return { user: null }
  }

  const { DB } = event.context.cloudflare.env

  const user = await DB.prepare('SELECT id, email, name, role FROM users WHERE id = ?')
    .bind(payload.userId)
    .first<User>()

  return { user: user || null }
})
