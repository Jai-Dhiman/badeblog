interface StoryRow {
  id: number
  title: string
  status: string
  category_id: number
  user_id: number
  created_at: string
  updated_at: string
  deleted_at: string | null
  user_name: string
  user_email: string
  user_role: string
  category_name: string
}

interface RichText {
  body: string | null
}

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id')!)

  const { DB } = event.context.cloudflare.env

  const story = await DB.prepare(
    `SELECT s.*, u.name as user_name, u.email as user_email, u.role as user_role, c.name as category_name
     FROM stories s
     LEFT JOIN users u ON s.user_id = u.id
     LEFT JOIN categories c ON s.category_id = c.id
     WHERE s.id = ?`
  )
    .bind(id)
    .first<StoryRow>()

  if (!story) {
    throw createError({ statusCode: 404, statusMessage: 'Story not found' })
  }

  const richText = await DB.prepare(
    `SELECT body FROM action_text_rich_texts
     WHERE record_type = 'Story' AND record_id = ? AND name = 'content'`
  )
    .bind(id)
    .first<RichText>()

  return {
    id: story.id,
    title: story.title,
    status: story.status,
    category_id: story.category_id,
    user_id: story.user_id,
    created_at: story.created_at,
    updated_at: story.updated_at,
    content: richText?.body || '',
    users: { name: story.user_name, email: story.user_email, role: story.user_role },
    categories: { name: story.category_name },
  }
})
