import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  const config = useRuntimeConfig()
  
  if (!token) {
    return sendRedirect(event, '/?unsubscribe_error=invalid_token')
  }
  
  // Initialize Supabase client with service role key
  const supabase = createClient(
    'https://pzvwoczyabsniqhqnxnz.supabase.co',
    config.supabaseServiceRoleKey
  )
  
  try {
    // Find and delete subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from('subscribers')
      .select('id')
      .eq('unsubscribe_token', token)
      .single()
    
    if (findError || !subscriber) {
      return sendRedirect(event, '/?unsubscribe_error=invalid_token')
    }
    
    const { error: deleteError } = await supabase
      .from('subscribers')
      .delete()
      .eq('unsubscribe_token', token)
    
    if (deleteError) {
      return sendRedirect(event, '/?unsubscribe_error=true')
    }
    
    return sendRedirect(event, '/?unsubscribed=true')
  } catch (error) {
    return sendRedirect(event, '/?unsubscribe_error=true')
  }
}) 