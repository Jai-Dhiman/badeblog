interface Comment {
  id: number
  user_id: number
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const id = parseInt(getRouterParam(event, 'id')!)

  const { DB } = event.context.cloudflare.env

  const existing = await DB.prepare('SELECT id, user_id FROM comments WHERE id = ?')
    .bind(id)
    .first<Comment>()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }

  if (existing.user_id !== event.context.auth.userId && event.context.auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized' })
  }

  await DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run()

  return { success: true }
})
