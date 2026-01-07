interface Story {
  id: number
  title: string
  status: string
  category_id: number
  user_id: number
  created_at: string
  updated_at: string
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const body = await readBody(event)
  const { title, content, category_id, status } = body

  if (!title || !category_id) {
    throw createError({ statusCode: 400, statusMessage: 'Title and category required' })
  }

  const { DB } = event.context.cloudflare.env

  const story = await DB.prepare(
    `INSERT INTO stories (title, status, category_id, user_id)
     VALUES (?, ?, ?, ?)
     RETURNING *`
  )
    .bind(title, status || 'draft', parseInt(category_id), event.context.auth.userId)
    .first<Story>()

  if (!story) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create story' })
  }

  if (content) {
    await DB.prepare(
      `INSERT INTO action_text_rich_texts (name, body, record_type, record_id)
       VALUES ('content', ?, 'Story', ?)`
    )
      .bind(content, story.id)
      .run()
  }

  return { ...story, content: content || '' }
})
