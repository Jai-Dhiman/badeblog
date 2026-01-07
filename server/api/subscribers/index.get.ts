interface Subscriber {
  id: number
  email: string
  unsubscribe_token: string
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth || event.context.auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { DB } = event.context.cloudflare.env

  const subscribers = await DB.prepare(
    'SELECT * FROM subscribers ORDER BY created_at DESC'
  ).all<Subscriber>()

  return subscribers.results || []
})
