interface Category {
  id: number
  name: string
}

export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env

  const categories = await DB.prepare('SELECT * FROM categories ORDER BY name').all<Category>()

  return categories.results || []
})
