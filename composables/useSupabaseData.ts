export const useSupabaseData = () => {
  const { user } = useAuth()

  // Stories
  const getStories = async (status = 'published') => {
    return await $fetch('/api/stories', {
      query: { status },
    })
  }

  const getStory = async (id: string) => {
    return await $fetch(`/api/stories/${id}`)
  }

  const getDrafts = async () => {
    if (!user.value) throw new Error('Authentication required')
    return await $fetch('/api/stories', {
      query: { status: 'draft', mine: 'true' },
    })
  }

  const createStory = async (storyData: Record<string, unknown>) => {
    if (!user.value) throw new Error('Authentication required')
    return await $fetch('/api/stories', {
      method: 'POST',
      body: storyData,
    })
  }

  const updateStory = async (id: string, storyData: Record<string, unknown>) => {
    if (!user.value) throw new Error('Authentication required')
    return await $fetch(`/api/stories/${id}`, {
      method: 'PUT',
      body: storyData,
    })
  }

  const deleteStory = async (id: string) => {
    if (!user.value) throw new Error('Authentication required')
    return await $fetch(`/api/stories/${id}`, {
      method: 'DELETE',
    })
  }

  // Categories
  const getCategories = async () => {
    return await $fetch('/api/categories')
  }

  const getCategory = async (id: string) => {
    const categories = await $fetch<{ id: number; name: string }[]>('/api/categories')
    return categories.find((c) => c.id === parseInt(id))
  }

  const getStoriesByCategory = async (categoryId: string, status = 'published') => {
    return await $fetch('/api/stories', {
      query: { categoryId, status },
    })
  }

  // Comments
  const getStoryComments = async (storyId: string) => {
    return await $fetch(`/api/stories/${storyId}/comments`)
  }

  const createComment = async (storyId: string, content: string) => {
    if (!user.value) throw new Error('Authentication required')
    return await $fetch(`/api/stories/${storyId}/comments`, {
      method: 'POST',
      body: { content },
    })
  }

  const deleteComment = async (commentId: string) => {
    if (!user.value) throw new Error('Authentication required')
    return await $fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })
  }

  // Subscribers
  const subscribeToNewStories = async (email: string) => {
    return await $fetch('/api/subscribers', {
      method: 'POST',
      body: { email },
    })
  }

  const getSubscribers = async () => {
    const subscribers = await $fetch<{ id: number; email: string }[]>('/api/subscribers')
    return {
      count: subscribers.length,
      subscribers: subscribers.map((s) => s.email),
    }
  }

  const getRecentComments = async () => {
    const comments = await $fetch<
      {
        id: number
        content: string
        created_at: string
        users: { name: string }
        stories: { title: string }
      }[]
    >('/api/comments/recent')

    return {
      data: comments.map((comment) => ({
        id: comment.id,
        attributes: {
          content: comment.content,
          'created-at': comment.created_at,
          'user-info': {
            name: comment.users?.name || 'Anonymous',
          },
          'story-info': {
            title: comment.stories?.title || 'Unknown Story',
          },
        },
      })),
    }
  }

  return {
    getStories,
    getStory,
    getDrafts,
    createStory,
    updateStory,
    deleteStory,
    getCategories,
    getCategory,
    getStoriesByCategory,
    getStoryComments,
    createComment,
    deleteComment,
    subscribeToNewStories,
    getSubscribers,
    getRecentComments,
  }
}
