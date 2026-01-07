interface CommentRow {
  id: number
  content: string
  story_id: number
  user_id: number
  created_at: string
  updated_at: string
  user_name: string
  user_email: string
}

export default defineEventHandler(async (event) => {
  const storyId = parseInt(getRouterParam(event, 'id')!)

  const { DB } = event.context.cloudflare.env

  const comments = await DB.prepare(
    `SELECT c.*, u.name as user_name, u.email as user_email
     FROM comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.story_id = ?
     ORDER BY c.created_at ASC`
  )
    .bind(storyId)
    .all<CommentRow>()

  return (comments.results || []).map((c) => ({
    id: c.id,
    content: c.content,
    story_id: c.story_id,
    user_id: c.user_id,
    created_at: c.created_at,
    updated_at: c.updated_at,
    users: { name: c.user_name, email: c.user_email },
  }))
})
