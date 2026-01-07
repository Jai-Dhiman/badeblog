<template>
  <form @submit.prevent="handleSubmit" class="card max-w-md mx-auto">
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
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
const { signInWithEmail, user, initAuth } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const route = useRoute()
const router = useRouter()

onMounted(async () => {
  await initAuth()
})

watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
}, { immediate: true })

async function handleSubmit() {
  error.value = ''
  isLoading.value = true

  try {
    await signInWithEmail(email.value, password.value)

    const redirect = route.query.redirect as string
    await router.push(redirect || '/')
  } catch (err: unknown) {
    console.error('Login error:', err)
    const errorObj = err as { data?: { message?: string }; message?: string }
    error.value = errorObj.data?.message || errorObj.message || 'Invalid email or password'
  } finally {
    isLoading.value = false
  }
}
</script>
