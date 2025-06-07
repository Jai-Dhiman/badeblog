import { defineNuxtPlugin } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  try {
    await authStore.initializeAuth()
  } catch (error) {
    console.error('Auth initialization failed:', error)
  }
}) 