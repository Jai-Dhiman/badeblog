interface CommentRow {
  id: number
  content: string
  story_id: number
  user_id: number
  created_at: string
  updated_at: string
  user_name: string
  user_email: string
  story_title: string
}

export default defineEventHandler(async (event) => {
  if (!event.context.auth || event.context.auth.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }

  const { DB } = event.context.cloudflare.env

  const comments = await DB.prepare(
    `SELECT c.*, u.name as user_name, u.email as user_email, s.title as story_title
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     LEFT JOIN stories s ON c.story_id = s.id
     ORDER BY c.created_at DESC
     LIMIT 10`
  ).all<CommentRow>()

  return (comments.results || []).map((c) => ({
    id: c.id,
    content: c.content,
    story_id: c.story_id,
    user_id: c.user_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
    users: { name: c.user_name, email: c.user_email },
    stories: { title: c.story_title },
  }))
})
