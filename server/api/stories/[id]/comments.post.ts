interface Comment {
  id: number
  content: string
  story_id: number
  user_id: number
  created_at: string
  updated_at: string
}

interface User {
  name: string
  email: string
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const storyId = parseInt(getRouterParam(event, 'id')!)
  const { content } = await readBody(event)

  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Content required' })
  }

  const { DB } = event.context.cloudflare.env

  const comment = await DB.prepare(
    `INSERT INTO comments (content, story_id, user_id)
     VALUES (?, ?, ?)
     RETURNING *`
  )
    .bind(content, storyId, event.context.auth.userId)
    .first<Comment>()

  if (!comment) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create comment' })
  }

  const user = await DB.prepare('SELECT name, email FROM users WHERE id = ?')
    .bind(event.context.auth.userId)
    .first<User>()

  return { ...comment, users: user }
})
