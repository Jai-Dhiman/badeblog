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
  category_name: string
}

interface RichText {
  body: string | null
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = (query.status as string) || 'published'
  const categoryId = query.categoryId as string | undefined
  const mine = query.mine === 'true'

  const { DB } = event.context.cloudflare.env

  let sql = `
    SELECT s.*, u.name as user_name, u.email as user_email, c.name as category_name
    FROM stories s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN categories c ON s.category_id = c.id
    WHERE s.status = ? AND s.deleted_at IS NULL
  `
  const params: (string | number)[] = [status]

  if (categoryId) {
    sql += ' AND s.category_id = ?'
    params.push(parseInt(categoryId))
  }

  if (mine && event.context.auth) {
    sql += ' AND s.user_id = ?'
    params.push(event.context.auth.userId)
  }

  sql += ' ORDER BY s.created_at DESC'

  const stories = await DB.prepare(sql).bind(...params).all<StoryRow>()

  const storiesWithContent = await Promise.all(
    (stories.results || []).map(async (story) => {
      const richText = await DB.prepare(
        `SELECT body FROM action_text_rich_texts
         WHERE record_type = 'Story' AND record_id = ? AND name = 'content'`
      )
        .bind(story.id)
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
        users: { name: story.user_name, email: story.user_email },
        categories: { name: story.category_name },
      }
    })
  )

  return storiesWithContent
})
