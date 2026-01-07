<template>
  <form @submit.prevent="handleSubmit" class="card max-w-md mx-auto">
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>

    <div v-if="success" class="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
      {{ success }}
    </div>

    <div class="mb-4">
      <label class="block text-gray-700 mb-2">Name:</label>
      <input v-model="name" type="text" required class="input" placeholder="Enter your name" />
    </div>
    <div class="mb-4">
      <label class="block text-gray-700 mb-2">Email:</label>
      <input v-model="email" type="email" required class="input" placeholder="Enter your email" />
    </div>
    <div class="mb-4">
      <label class="block text-gray-700 mb-2">Password:</label>
      <input
        v-model="password"
        type="password"
        required
        class="input"
        placeholder="Enter your password"
      />
    </div>
    <div class="mb-6">
      <label class="block text-gray-700 mb-2">Confirm Password:</label>
      <input
        v-model="passwordConfirmation"
        type="password"
        required
        class="input"
        placeholder="Confirm your password"
      />
    </div>
    <button type="submit" class="btn btn-primary w-full" :disabled="isLoading">
      {{ isLoading ? 'Signing up...' : 'Sign Up' }}
    </button>

    <div class="mt-4 text-center">
      Already have an account?
      <NuxtLink to="/login" class="text-accent hover:text-secondary">Login</NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
const { signUpWithEmail, user, initAuth } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)
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
  success.value = ''

  if (password.value !== passwordConfirmation.value) {
    error.value = 'Passwords do not match'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  isLoading.value = true

  try {
    await signUpWithEmail(email.value, password.value, name.value)
    await router.push('/')
  } catch (err: unknown) {
    console.error('Registration error:', err)
    const errorObj = err as { data?: { message?: string }; message?: string }
    error.value = errorObj.data?.message || errorObj.message || 'An error occurred while creating your account'
  } finally {
    isLoading.value = false
  }
}
</script>
