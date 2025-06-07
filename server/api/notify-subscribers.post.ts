import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { storyId, message } = await readBody(event)
  const config = useRuntimeConfig()
  
  // Initialize Supabase client with service role key
  const supabase = createClient(
    'https://pzvwoczyabsniqhqnxnz.supabase.co',
    config.supabaseServiceRoleKey
  )
  
  try {
    // Get story data
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('title, id')
      .eq('id', storyId)
      .single()
    
    if (storyError) throw storyError
    
    // Get all subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('subscribers')
      .select('email, unsubscribe_token')
    
    if (subscribersError) throw subscribersError
    
    if (!subscribers || subscribers.length === 0) {
      return { message: 'No subscribers found' }
    }
    
    // Get frontend URL from runtime config
    const frontendUrl = config.public.frontendUrl
    
    // Send emails to all subscribers using fetch API instead of Resend package
    const emailPromises = subscribers.map(async (subscriber: any) => {
      const unsubscribeUrl = `${frontendUrl}/api/unsubscribe/${subscriber.unsubscribe_token}`
      const storyUrl = `${frontendUrl}/stories/${story.id}`
      
      const emailPayload = {
        from: 'onboarding@resend.dev', // This works in Resend sandbox mode
        to: subscriber.email,
        subject: `New Story "${story.title}" published by PR Dhiman`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { padding: 20px 0; }
              .button { 
                display: inline-block; 
                background-color: #007bff; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 4px; 
                margin: 20px 0;
              }
              .footer { 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #eee; 
                font-size: 12px; 
                color: #666; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; color: #333;">${story.title}</h1>
              </div>
              
              <div class="content">
                <h3 style="color: #555;">${message}</h3>
                
                <p>A new story has been published on My Ideas My Words!</p>
                
                <a href="${storyUrl}" class="button">Read Story</a>
                
                <p>Thank you for being a subscriber!</p>
              </div>
              
              <div class="footer">
                <p>
                  You're receiving this because you subscribed to updates from My Ideas My Words.
                  <br>
                  <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      }

      // Use fetch API to call Resend API directly
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload)
      })

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`)
      }

      return await response.json()
    })
    
    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises)
    
    // Count successes and failures
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length
    
    if (failed > 0) {
      console.error(`Failed to send ${failed} emails out of ${subscribers.length}`)
    }
    
    return { 
      message: `Notifications sent successfully to ${successful} subscribers${failed > 0 ? ` (${failed} failed)` : ''}` 
    }
  } catch (error) {
    console.error('Email notification error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send notifications'
    })
  }
}) 