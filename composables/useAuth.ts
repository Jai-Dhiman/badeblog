interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
}

interface AuthState {
  user: User | null
  initialized: boolean
}

const authState = reactive<AuthState>({
  user: null,
  initialized: false,
})

export const useAuth = () => {
  const user = computed(() => authState.user)
  const isAuthenticated = computed(() => !!authState.user)
  const isAdmin = computed(() => authState.user?.role === 'admin')

  const initAuth = async () => {
    if (authState.initialized) return

    try {
      const response = await $fetch<{ user: User | null }>('/api/auth/me')
      authState.user = response.user
    } catch {
      authState.user = null
    } finally {
      authState.initialized = true
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    const response = await $fetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    authState.user = response.user
    return response
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const response = await $fetch<{ user: User }>('/api/auth/signup', {
      method: 'POST',
      body: { email, password, name },
    })
    authState.user = response.user
    return response
  }

  const signOut = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    authState.user = null
  }

  const getUserProfile = () => {
    return authState.user
  }

  const checkIsAdmin = () => {
    return authState.user?.role === 'admin'
  }

  const updateUserProfile = async (_updates: Partial<User>) => {
    throw new Error('Profile updates not implemented')
  }

  return {
    user,
    isAdmin,
    isAuthenticated,
    initAuth,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    getUserProfile,
    updateUserProfile,
    checkIsAdmin,
  }
}
