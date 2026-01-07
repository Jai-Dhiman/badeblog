import { verifyPassword } from '../../utils/password'
import { createToken } from '../../utils/jwt'

interface User {
  id: number
  email: string
  name: string
  password_hash: string
  role: string
}

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  const { DB } = event.context.cloudflare.env
  const jwtSecret = event.context.cloudflare.env.JWT_SECRET

  const user = await DB.prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>()

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const validPassword = await verifyPassword(password, user.password_hash)
  if (!validPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid email or password' })
  }

  const token = await createToken(
    { userId: user.id, email: user.email, role: user.role },
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
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  }
})
