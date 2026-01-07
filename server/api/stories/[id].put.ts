interface Story {
  id: number
  user_id: number
}

interface RichText {
  id: number
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const id = parseInt(getRouterParam(event, 'id')!)
  const body = await readBody(event)
  const { title, content, category_id, status } = body

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

  const updated = await DB.prepare(
    `UPDATE stories SET title = ?, status = ?, category_id = ?, updated_at = ?
     WHERE id = ?
     RETURNING *`
  )
    .bind(title, status, parseInt(category_id), now, id)
    .first()

  if (content !== undefined) {
    const existingContent = await DB.prepare(
      `SELECT id FROM action_text_rich_texts
       WHERE record_type = 'Story' AND record_id = ? AND name = 'content'`
    )
      .bind(id)
      .first<RichText>()

    if (existingContent) {
      await DB.prepare(
        `UPDATE action_text_rich_texts SET body = ?, updated_at = ? WHERE id = ?`
      )
        .bind(content, now, existingContent.id)
        .run()
    } else {
      await DB.prepare(
        `INSERT INTO action_text_rich_texts (name, body, record_type, record_id)
         VALUES ('content', ?, 'Story', ?)`
      )
        .bind(content, id)
        .run()
    }
  }

  return { ...updated, content }
})
