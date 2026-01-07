interface Subscriber {
  id: number
}

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')

  if (!token) {
    return sendRedirect(event, '/?unsubscribe_error=invalid_token')
  }

  const { DB } = event.context.cloudflare.env

  try {
    const subscriber = await DB.prepare(
      'SELECT id FROM subscribers WHERE unsubscribe_token = ?'
    )
      .bind(token)
      .first<Subscriber>()

    if (!subscriber) {
      return sendRedirect(event, '/?unsubscribe_error=invalid_token')
    }

    await DB.prepare('DELETE FROM subscribers WHERE unsubscribe_token = ?')
      .bind(token)
      .run()

    return sendRedirect(event, '/?unsubscribed=true')
  } catch (error) {
    return sendRedirect(event, '/?unsubscribe_error=true')
  }
})
