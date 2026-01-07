import { hashPassword } from '../../utils/password'
import { createToken } from '../../utils/jwt'

interface User {
  id: number
  email: string
  name: string
  role: string
}

export default defineEventHandler(async (event) => {
  const { email, password, name } = await readBody(event)

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, statusMessage: 'Email, password, and name required' })
  }

  if (password.length < 6) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters' })
  }

  const { DB } = event.context.cloudflare.env
  const jwtSecret = event.context.cloudflare.env.JWT_SECRET

  const existingUser = await DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email)
    .first()

  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Email already registered' })
  }

  const passwordHash = await hashPassword(password)

  const result = await DB.prepare(
    'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?) RETURNING id, email, name, role'
  )
    .bind(email, name, passwordHash, 'user')
    .first<User>()

  if (!result) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create user' })
  }

  const token = await createToken(
    { userId: result.id, email: result.email, role: result.role },
    jwtSecret
  )

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return {
    user: {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
    },
  }
})
