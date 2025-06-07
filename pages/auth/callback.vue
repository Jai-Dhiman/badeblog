<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
      <h2 class="mt-4 text-lg font-medium text-gray-900">Signing you in...</h2>
      <p class="mt-2 text-sm text-gray-600">Please wait while we complete your authentication.</p>
    </div>
  </div>
</template>

<script setup>
// This page handles the OAuth callback
// The Supabase client will automatically handle the token exchange
const user = useSupabaseUser()

// Watch for user authentication and redirect
watch(user, (newUser) => {
  if (newUser) {
    navigateTo('/')
  }
}, { immediate: true })

// If no user after a timeout, redirect to login with error
setTimeout(() => {
  if (!user.value) {
    navigateTo('/auth/login?error=callback_failed')
  }
}, 10000) // 10 second timeout
</script> 