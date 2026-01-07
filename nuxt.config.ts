// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['@/assets/main.css'],

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    resendApiKey: process.env.RESEND_API_KEY,
    // Public keys (exposed to client-side)
    public: {
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
  },

  // Configure for Cloudflare deployment
  nitro: {
    preset: 'cloudflare-module',
  },
})
