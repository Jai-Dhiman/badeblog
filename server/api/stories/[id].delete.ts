interface Story {
  id: number
  user_id: number
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const id = parseInt(getRouterParam(event, 'id')!)

  const { DB } = event.context.cloudflare.env

  const existing = await DB.prepare('SELECT id, user_id FROM stories WHERE id = ?')
    .bind(id)
    .first<Story>()

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }

  if (existing.user_id !== event.context.auth.userId && event.context.auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Not authorized' })
  }

  const now = new Date().toISOString()

  const deleted = await DB.prepare(
    `UPDATE stories SET deleted_at = ?, updated_at = ? WHERE id = ? RETURNING *`
  )
    .bind(now, now, id)
    .first()

  return deleted
})
