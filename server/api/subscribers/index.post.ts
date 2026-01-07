interface Subscriber {
  id: number
  email: string
  unsubscribe_token: string
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email required' })
  }

  const { DB } = event.context.cloudflare.env

  const unsubscribeToken = crypto.randomUUID()

  try {
    const subscriber = await DB.prepare(
      `INSERT INTO subscribers (email, unsubscribe_token)
       VALUES (?, ?)
       RETURNING *`
    )
      .bind(email, unsubscribeToken)
      .first<Subscriber>()

    return subscriber
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw createError({ statusCode: 409, statusMessage: 'Email already subscribed' })
    }
    throw error
  }
})
