export const useSupabaseData = () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

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
          .single()
        
        if (richTextData) {
          story.content = richTextData.body
        }
      }))
    }
    
    return data || []
  }

  const getStory = async (id: string) => {
    console.log('=== DEBUG: Fetching story with ID:', id, 'type:', typeof id)
    
    // First get the story basic info
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email, role),
        categories(name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    if (storyError) throw storyError
    
    console.log('=== DEBUG: Story found:', { id: story.id, title: story.title })
    
    // Let's also check what ActionText records exist for debugging
    const { data: allActionTextRecords } = await supabase
      .from('action_text_rich_texts')
      .select('record_id, record_type, name')
      .eq('record_type', 'Story')
    
    console.log('=== DEBUG: All ActionText records for Stories:', allActionTextRecords?.map(r => ({ record_id: r.record_id, name: r.name })))
    
    // Then get the rich text content from action_text_rich_texts
    const { data: richTextData, error: richTextError } = await supabase
      .from('action_text_rich_texts')
      .select('body')
      .eq('record_type', 'Story')
      .eq('record_id', id)
      .eq('name', 'content')
      .single()
    
    console.log('=== DEBUG: ActionText query for ID', id, ':', { richTextData, richTextError })
    
    // If there's rich text content, use it; otherwise fall back to the content column
    if (!richTextError && richTextData) {
      story.content = richTextData.body
    } else {
      console.log('=== DEBUG: No ActionText content found, using fallback story.content:', story.content?.substring(0, 100))
    }
    
    return story
  }

  const getDrafts = async () => {
    if (!user.value) throw new Error('Authentication required')
    
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email),
        categories(name)
      `)
      .eq('user_id', user.value.id)
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
          .single()
        
        if (richTextData) {
          story.content = richTextData.body
        }
      }))
    }
    
    return data || []
  }

  const createStory = async (storyData: Record<string, any>) => {
    if (!user.value) throw new Error('Authentication required')
    
    // Extract content for ActionText
    const { content, ...storyFields } = storyData
    
    // Create the story record first
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        ...storyFields,
        user_id: user.value.id
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
    // Extract content for ActionText
    const { content, ...storyFields } = storyData
    
    // Update the story record
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .update(storyFields)
      .eq('id', id)
      .select()
      .single()
    
    if (storyError) throw storyError
    
    // If there's content, update the ActionText record
    if (content !== undefined) {
      // Try to update existing ActionText record
      const { data: existingContent, error: fetchError } = await supabase
        .from('action_text_rich_texts')
        .select('id')
        .eq('record_type', 'Story')
        .eq('record_id', id)
        .eq('name', 'content')
        .single()
      
      if (existingContent) {
        // Update existing content
        const { error: updateError } = await supabase
          .from('action_text_rich_texts')
          .update({ body: content })
          .eq('id', existingContent.id)
        
        if (updateError) {
          console.error('Failed to update ActionText content:', updateError)
        }
      } else {
        // Create new content record
        const { error: insertError } = await supabase
          .from('action_text_rich_texts')
          .insert({
            name: 'content',
            body: content,
            record_type: 'Story',
            record_id: id
          })
        
        if (insertError) {
          console.error('Failed to create ActionText content:', insertError)
        }
      }
      
      // Add content to the returned story object
      if (story) {
        story.content = content
      }
    }
    
    return story
  }

  const deleteStory = async (id: string) => {
    // Soft delete
    const { data, error } = await supabase
      .from('stories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
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

  const getStoriesByCategory = async (categoryId: string) => {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        users(name, email),
        categories(name)
      `)
      .eq('category_id', categoryId)
      .eq('status', 'published')
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
          .single()
        
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
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }

  const createComment = async (storyId: string, content: string) => {
    if (!user.value) throw new Error('Authentication required')
    
    const { data, error } = await supabase
      .from('comments')
      .insert({
        story_id: storyId,
        user_id: user.value.id,
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
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
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
      .eq('id', user.value.id)
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
      .eq('id', user.value.id)
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