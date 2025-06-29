<template>
  <form @submit.prevent="handleSubmit" class="card max-w-md mx-auto">
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>

    <button
      type="button"
      @click="handleGoogleLogin"
      class="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google logo"
        class="w-5 h-5"
      />
      <span class="text-gray-700 font-medium">Continue with Google</span>
    </button>

    <div class="relative mb-4">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-gray-500">Or continue with email</span>
      </div>
    </div>

    <div class="mb-4">
      <label class="block text-gray-700 mb-2">Email:</label>
      <input v-model="email" type="email" required class="input" placeholder="Enter your email" />
    </div>

    <div class="mb-6">
      <label class="block text-gray-700 mb-2">Password:</label>
      <input
        v-model="password"
        type="password"
        required
        class="input"
        placeholder="Enter your password"
      />
    </div>

    <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
      {{ isLoading ? 'Logging in...' : 'Login' }}
    </button>

    <div class="mt-4 text-center text-sm">
      Don't have an account?
      <NuxtLink to="/signup" class="text-accent hover:text-secondary ml-1">
        Sign Up
      </NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import type { ApiError } from '~/types'

const { signInWithEmail, signInWithGoogle } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const route = useRoute()
const router = useRouter()

const runtimeConfig = useRuntimeConfig()
const apiUrl = runtimeConfig.public.apiUrl || 'https://web-production-e3d6.up.railway.app'

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    await signInWithEmail(email.value, password.value)
    
    const redirect = route.query.redirect as string
    await router.push(redirect || '/')
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || 'Invalid email or password'
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleLogin() {
  try {
    isLoading.value = true
    error.value = ''
    
    await signInWithGoogle()
    // OAuth redirect will handle the rest
  } catch (err: any) {
    console.error('Google login error:', err)
    error.value = err.message || 'Failed to sign in with Google'
    isLoading.value = false
  }
}

// Prevent authenticated users from accessing login
const user = useSupabaseUser()
watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
}, { immediate: true })
</script> 