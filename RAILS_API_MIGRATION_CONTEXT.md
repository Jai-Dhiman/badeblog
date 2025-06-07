# Rails API Migration Context Document

## Overview
This document contains all the information needed to implement the remaining Rails API functionality that must be migrated before the Rails API can be fully decommissioned. The core blog functionality has been successfully migrated to Supabase.

## ❌ Remaining Functionality to Migrate

### 1. Email Notifications System
### 2. Unsubscribe Link Handling

---

## 📧 EMAIL NOTIFICATIONS SYSTEM

### Current Rails Implementation

#### Controller Endpoint
```ruby
# POST /stories/:id/send_notification
def send_notification
  @story = Story.find(params[:id])
  custom_message = params[:message]
  
  Subscriber.find_each do |subscriber|
    StoryMailer.custom_story_notification(subscriber, @story, custom_message).deliver_later
  end
  
  render json: { message: 'Notifications sent successfully' }
rescue => e
  Rails.logger.error "Notification error: #{e.message}"
  render json: { error: e.message }, status: :unprocessable_entity
end
```

#### Mailer Class
```ruby
# app/mailers/story_mailer.rb
class StoryMailer < ApplicationMailer
  def custom_story_notification(subscriber, story, custom_message)
    @story = story
    @subscriber = subscriber
    @custom_message = custom_message
    @unsubscribe_url = "#{ENV['BACKEND_URL'] || 'https://web-production-e3d6.up.railway.app'}/unsubscribe/#{@subscriber.unsubscribe_token}"
    
    mail(
      to: @subscriber.email,
      subject: "New Story #{@story.title} published by PR Dhiman"
    )
  end
end
```

#### Email Template
```html
<!-- app/views/story_mailer/custom_story_notification.html.erb -->
<!DOCTYPE html>
<html>
<head>
  <meta content='text/html; charset=UTF-8' http-equiv='Content-Type' />
</head>
<body>
  <h2><%= @story.title %></h2>
  
  <h4><%= @custom_message %></h4>
  
  <p>Read Story: <%= link_to "Click here", story_url(@story) %></p>

  <div style="margin-top: 20px; font-size: 12px; color: #666;">
    <p>To <a href="<%= @unsubscribe_url %>">unsubscribe</a></p>
  </div>
</body>
</html>
```

### Current Client Usage
```vue
<!-- packages/client/components/NotificationModal.vue -->
<script setup>
import { sendStoryNotification } from '~/services/api'

const sendNotification = async () => {
  await sendStoryNotification(props.storyId, message.value)
  // Handle success/error
}
</script>
```

```typescript
// packages/client/services/api.ts
export const sendStoryNotification = async (storyId: number | string, message: string) => {
  return api.post(`/stories/${storyId}/send_notification`, { message })
}
```

### Migration Requirements

#### Data Needed for Email Notifications:
1. **Story Data**: Title, URL (frontend URL)
2. **Subscriber List**: All active subscribers with emails
3. **Custom Message**: Admin-provided message
4. **Unsubscribe Token**: For each subscriber

#### Implementation Options:

##### Option A: Cloudflare Workers + Email API
```typescript
// Example Cloudflare Worker structure
export default {
  async fetch(request, env) {
    if (request.method === 'POST' && url.pathname === '/api/notify-subscribers') {
      const { storyId, message } = await request.json()
      
      // 1. Get story data from Supabase
      // 2. Get all subscribers from Supabase  
      // 3. Send emails via Resend/SendGrid/Cloudflare Email
      // 4. Include unsubscribe link for each subscriber
    }
  }
}
```

##### Option B: Nuxt Server API Routes
```typescript
// server/api/notify-subscribers.post.ts
export default defineEventHandler(async (event) => {
  const { storyId, message } = await readBody(event)
  // Implementation similar to Cloudflare Worker
})
```

##### Option C: Supabase Edge Functions
```typescript
// supabase/functions/notify-subscribers/index.ts
Deno.serve(async (req) => {
  const { storyId, message } = await req.json()
  // Implementation using Deno and email service
})
```

---

## 🔗 UNSUBSCRIBE LINK HANDLING

### Current Rails Implementation

#### Route
```ruby
# config/routes.rb
get 'unsubscribe/:token', to: 'subscribers#unsubscribe', as: 'unsubscribe'
```

#### Controller
```ruby
# app/controllers/subscribers_controller.rb
def unsubscribe
  @subscriber = Subscriber.find_by!(unsubscribe_token: params[:token])
  if @subscriber.destroy
    redirect_url = "#{ENV['FRONTEND_URL']}?unsubscribed=true"
    redirect_to redirect_url, allow_other_host: true
  else
    redirect_to "#{ENV['FRONTEND_URL']}?unsubscribe_error=true", allow_other_host: true
  end
rescue ActiveRecord::RecordNotFound
  redirect_to "#{ENV['FRONTEND_URL']}?unsubscribe_error=invalid_token", allow_other_host: true
end
```

#### Model Token Generation
```ruby
# app/models/subscriber.rb
class Subscriber < ApplicationRecord
  before_create :generate_unsubscribe_token

  private

  def generate_unsubscribe_token
    self.unsubscribe_token = SecureRandom.urlsafe_base64
  end
end
```

### Current Client Usage
```vue
<!-- packages/client/pages/index.vue -->
<script setup>
// Handle unsubscribe query parameters
if (route.query.unsubscribed === 'true') {
  alert('You have been successfully unsubscribed.')
} else if (route.query.unsubscribe_error) {
  alert('There was an error processing your unsubscribe request.')
}
</script>
```

### Migration Requirements

#### Implementation Options:

##### Option A: Cloudflare Workers
```typescript
// GET /api/unsubscribe/:token
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const token = url.pathname.split('/').pop()
    
    // 1. Find subscriber by unsubscribe_token in Supabase
    // 2. Delete subscriber record
    // 3. Redirect to frontend with appropriate query params
    
    if (success) {
      return Response.redirect(`${FRONTEND_URL}?unsubscribed=true`)
    } else {
      return Response.redirect(`${FRONTEND_URL}?unsubscribe_error=true`)
    }
  }
}
```

##### Option B: Nuxt Server API Routes
```typescript
// server/api/unsubscribe/[token].get.ts
export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  // Implementation with Supabase client
  // Return redirect response
})
```

---

## 📊 DATABASE SCHEMA REQUIREMENTS

### Subscribers Table (Already in Supabase)
```sql
-- The subscribers table should have these columns:
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  unsubscribe_token VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stories Table Reference
```sql
-- Stories table fields needed for emails:
-- id, title, status, created_at
-- URL will be constructed as: ${FRONTEND_URL}/stories/${id}
```

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

### For Email Service
```bash
# Choose one email service:
RESEND_API_KEY=your_resend_api_key
# OR
SENDGRID_API_KEY=your_sendgrid_api_key
# OR
MAILGUN_API_KEY=your_mailgun_api_key

# Frontend URL for links
FRONTEND_URL=https://your-blog-domain.com

# Supabase connection (if using Workers/Edge Functions)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🧪 TESTING REQUIREMENTS

### Email Notification Testing
1. **Test with single subscriber**: Verify email content, formatting, links
2. **Test with multiple subscribers**: Ensure all receive emails
3. **Test error handling**: Invalid story ID, email service failures
4. **Test unsubscribe links**: Verify tokens are unique and work
5. **Test custom messages**: Ensure HTML/text is properly handled

### Unsubscribe Testing
1. **Valid token**: Should delete subscriber and redirect with success
2. **Invalid token**: Should redirect with error message
3. **Already unsubscribed**: Should handle gracefully
4. **Frontend handling**: Verify query parameter processing

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Email Notifications
- [ ] Choose email service (Resend recommended for simplicity)
- [ ] Set up Cloudflare Worker or Nuxt API route
- [ ] Implement subscriber fetching from Supabase
- [ ] Create HTML email template
- [ ] Test email sending functionality
- [ ] Update client to use new endpoint

### Phase 2: Unsubscribe Handling  
- [ ] Set up unsubscribe endpoint (same service as emails)
- [ ] Implement token validation with Supabase
- [ ] Implement subscriber deletion
- [ ] Test redirect functionality
- [ ] Verify frontend query parameter handling

### Phase 3: Client Updates
- [ ] Remove `services/api.ts` file
- [ ] Update `NotificationModal.vue` to use new endpoint
- [ ] Update any remaining API references
- [ ] Test full user flow

### Phase 4: Cleanup
- [ ] Remove Rails API repository
- [ ] Update deployment configurations
- [ ] Update documentation

---

## 🚀 RECOMMENDED IMPLEMENTATION

### 1. Use Resend for Email Service
- Simple API, good deliverability
- HTML email support built-in
- Generous free tier

### 2. Use Cloudflare Workers
- Fast, global edge locations
- Integrates well with your planned CF deployment
- Simple redirect handling

### 3. Sample Implementation Structure
```
cloudflare-workers/
├── src/
│   ├── email-notifications.ts
│   ├── unsubscribe.ts
│   ├── templates/
│   │   └── story-notification.html
│   └── utils/
│       └── supabase.ts
└── wrangler.toml
```

---

## 📞 SUPPORT REFERENCES

### Email Services Documentation
- **Resend**: https://resend.com/docs
- **SendGrid**: https://docs.sendgrid.com
- **Cloudflare Email Workers**: https://developers.cloudflare.com/email-routing/

### Cloudflare Workers
- **Documentation**: https://developers.cloudflare.com/workers/
- **Supabase Integration**: Use supabase-js in Workers

### Testing Tools
- **Email Testing**: Use Resend's test mode or email testing services
- **Worker Testing**: Cloudflare Workers Playground

---

*This document contains all the information needed to implement the remaining Rails API functionality. Save this document before deleting the Rails API repository.* 