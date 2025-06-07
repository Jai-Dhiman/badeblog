// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  css: ['@/assets/main.css'],
  
  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    // Public keys (exposed to client-side)
    public: {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  },
  
  // Supabase configuration
  supabase: {
    url: 'https://pzvwoczyabsniqhqnxnz.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dndvY3p5YWJzbmlxaHFueG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkyNjYxMDYsImV4cCI6MjA2NDg0MjEwNn0.BH8iMwaQ_vY9ct6W_Q536LtN7jf19KGEyyUB8kSHt-M',
    // Disable global auth redirect
    redirect: false
  },
  
  // Configure for Cloudflare deployment
  nitro: {
    preset: 'cloudflare-module'
  }
})
