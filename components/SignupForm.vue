<template>
  <form @submit.prevent="handleSubmit" class="card max-w-md mx-auto">
    <!-- Add error alert if there's an error -->
    <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      {{ error }}
    </div>

    <!-- Add success message -->
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
    
    <!-- Google OAuth option -->
    <div class="mt-4">
      <button
        type="button"
        @click="handleGoogleSignup"
        :disabled="isLoading"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          class="w-5 h-5"
        />
        <span class="text-gray-700 font-medium">Sign up with Google</span>
      </button>
    </div>
    
    <div class="mt-4 text-center">
      Already have an account?
      <NuxtLink to="/login" class="text-accent hover:text-secondary">Login</NuxtLink>
    </div>
  </form>
</template>

<script setup lang="ts">
const { signUpWithEmail, signInWithGoogle } = useAuth()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')
const success = ref('')
const isLoading = ref(false)
const router = useRouter()

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
    
    success.value = 'Account created successfully! Please check your email to verify your account.'
    
    // Clear form
    name.value = ''
    email.value = ''
    password.value = ''
    passwordConfirmation.value = ''
    
  } catch (err: any) {
    console.error('Registration error:', err)
    error.value = err.message || 'An error occurred while creating your account'
  } finally {
    isLoading.value = false
  }
}

async function handleGoogleSignup() {
  try {
    isLoading.value = true
    error.value = ''
    
    await signInWithGoogle()
    // OAuth redirect will handle the rest
  } catch (err: any) {
    console.error('Google signup error:', err)
    error.value = err.message || 'Failed to sign up with Google'
    isLoading.value = false
  }
}

// Prevent authenticated users from accessing signup page
const user = useSupabaseUser()
watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
}, { immediate: true })
</script> 