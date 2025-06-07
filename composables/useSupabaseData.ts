export const useSupabaseData = () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  // Helper function to get current user's integer ID
  const getCurrentUserIntegerId = async () => {
    if (!user.value) return null
    
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('supabase_auth_id', user.value.id)
      .single()
    
    return data?.id || null
  }

  // Stories
  const getStories = async (status = 'published') => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email),
        categories(name)
      `)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // For each story, try to get the rich text content
    if (data) {
      await Promise.all(data.map(async (story: any) => {
        const { data: richTextData } = await supabase
          .from('action_text_rich_texts')
          .select('body')
          .eq('record_type', 'Story')
          .eq('record_id', story.id)
          .eq('name', 'content')
          .maybeSingle()
        
        if (richTextData) {
          story.content = richTextData.body
        }
      }))
    }
    
    return data || []
  }

  const getStory = async (id: string) => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email, role),
        categories(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    
    // Get rich text content
    if (data) {
      const { data: richTextData } = await supabase
        .from('action_text_rich_texts')
        .select('body')
        .eq('record_type', 'Story')
        .eq('record_id', data.id)
        .eq('name', 'content')
        .maybeSingle()
      
      if (richTextData) {
        data.content = richTextData.body
      }
    }
    
    return data
  }

  const getDrafts = async () => {
    if (!user.value) throw new Error('Authentication required')
    
    const userIntegerId = await getCurrentUserIntegerId()
    if (!userIntegerId) throw new Error('User profile not found')
    
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email),
        categories(name)
      `)
      .eq('user_id', userIntegerId)
      .eq('status', 'draft')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // For each story, try to get the rich text content
    if (data) {
      await Promise.all(data.map(async (story: any) => {
        const { data: richTextData } = await supabase
          .from('action_text_rich_texts')
          .select('body')
          .eq('record_type', 'Story')
          .eq('record_id', story.id)
          .eq('name', 'content')
          .maybeSingle()
        
        if (richTextData) {
          story.content = richTextData.body
        }
      }))
    }
    
    return data || []
  }

  const createStory = async (storyData: Record<string, any>) => {
    if (!user.value) throw new Error('Authentication required')
    
    const userIntegerId = await getCurrentUserIntegerId()
    if (!userIntegerId) throw new Error('User profile not found')
    
    // Extract content for ActionText
    const { content, ...storyFields } = storyData
    
    // Create the story record first
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        ...storyFields,
        user_id: userIntegerId
      })
      .select()
      .single()
    
    if (storyError) throw storyError
    
    // If there's content, create the ActionText record
    if (content && story) {
      const { error: contentError } = await supabase
        .from('action_text_rich_texts')
        .insert({
          name: 'content',
          body: content,
          record_type: 'Story',
          record_id: story.id
        })
      
      if (contentError) {
        console.error('Failed to create ActionText content:', contentError)
        // Still return the story even if content creation fails
      }
      
      // Add content to the returned story object
      story.content = content
    }
    
    return story
  }

  const updateStory = async (id: string, storyData: Record<string, any>) => {
    if (!user.value) throw new Error('Authentication required')
    
    const userIntegerId = await getCurrentUserIntegerId()
    if (!userIntegerId) throw new Error('User profile not found')
    
    // Extract content for ActionText
    const { content, ...storyFields } = storyData
    
    // Update the story record
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .update({
        ...storyFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userIntegerId) // Ensure user owns this story
      .select()
      .single()
    
    if (storyError) throw storyError
    
    // Update ActionText content if provided
    if (content !== undefined && story) {
      // Try to update existing content first
      const { error: updateContentError } = await supabase
        .from('action_text_rich_texts')
        .update({ body: content })
        .eq('record_type', 'Story')
        .eq('record_id', story.id)
        .eq('name', 'content')
      
      if (updateContentError) {
        // If update fails, try to insert new content
        const { error: insertContentError } = await supabase
          .from('action_text_rich_texts')
          .insert({
            name: 'content',
            body: content,
            record_type: 'Story',
            record_id: story.id
          })
        
        if (insertContentError) {
          console.error('Failed to update ActionText content:', insertContentError)
        }
      }
      
      // Add content to the returned story object
      story.content = content
    }
    
    return story
  }

  const deleteStory = async (id: string) => {
    if (!user.value) throw new Error('Authentication required')
    
    const userIntegerId = await getCurrentUserIntegerId()
    if (!userIntegerId) throw new Error('User profile not found')
    
    // Soft delete by setting deleted_at
    const { data, error } = await supabase
      .from('stories')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userIntegerId) // Ensure user owns this story
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Categories
  const getCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  }

  const getCategory = async (id: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  }

  const getStoriesByCategory = async (categoryId: string, status = 'published') => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email),
        categories(name)
      `)
      .eq('category_id', categoryId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // For each story, try to get the rich text content
    if (data) {
      await Promise.all(data.map(async (story: any) => {
        const { data: richTextData } = await supabase
          .from('action_text_rich_texts')
          .select('body')
          .eq('record_type', 'Story')
          .eq('record_id', story.id)
          .eq('name', 'content')
          .maybeSingle()
        
        if (richTextData) {
          story.content = richTextData.body
        }
      }))
    }
    
    return data || []
  }

  // Comments
  const getStoryComments = async (storyId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users(name, email)
      `)
      .eq('story_id', storyId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  }

  const createComment = async (storyId: string, content: string) => {
    if (!user.value) throw new Error('Authentication required')
    
    const userIntegerId = await getCurrentUserIntegerId()
    if (!userIntegerId) throw new Error('User profile not found')
    
    const { data, error } = await supabase
      .from('comments')
      .insert({
        story_id: storyId,
        user_id: userIntegerId,
        content
      })
      .select(`
        *,
        users(name, email)
      `)
      .single()
    
    if (error) throw error
    return data
  }

  const deleteComment = async (commentId: string) => {
    if (!user.value) throw new Error('Authentication required')
    
    const userIntegerId = await getCurrentUserIntegerId()
    if (!userIntegerId) throw new Error('User profile not found')
    
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userIntegerId) // Ensure user owns this comment
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Subscribers
  const subscribeToNewStories = async (email: string) => {
    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email,
        unsubscribe_token: crypto.randomUUID()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  const getSubscribers = async () => {
    // This should only be accessible to admins
    if (!user.value) throw new Error('Authentication required')
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_auth_id', user.value.id)
      .single()
    
    if (userData?.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    const { data, error } = await supabase
      .from('subscribers')
      .select('email')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return {
      count: data?.length || 0,
      subscribers: data?.map((s: any) => s.email) || []
    }
  }

  const getRecentComments = async () => {
    // This should only be accessible to admins
    if (!user.value) throw new Error('Authentication required')
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_auth_id', user.value.id)
      .single()
    
    if (userData?.role !== 'admin') {
      throw new Error('Unauthorized')
    }
    
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users(name, email),
        stories(title)
      `)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) throw error
    
    // Transform to match your existing format
    const transformedData = data?.map((comment: any) => ({
      id: comment.id,
      attributes: {
        content: comment.content,
        'created-at': comment.created_at,
        'user-info': {
          name: comment.users?.name || 'Anonymous'
        },
        'story-info': {
          title: comment.stories?.title || 'Unknown Story'
        }
      }
    })) || []
    
    return { data: transformedData }
  }

  return {
    // Stories
    getStories,
    getStory,
    getDrafts,
    createStory,
    updateStory,
    deleteStory,
    
    // Categories
    getCategories,
    getCategory,
    getStoriesByCategory,
    
    // Comments
    getStoryComments,
    createComment,
    deleteComment,
    
    // Subscribers
    subscribeToNewStories,
    getSubscribers,
    getRecentComments
  }
} 