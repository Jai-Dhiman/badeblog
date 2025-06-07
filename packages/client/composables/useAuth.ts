export const useAuth = () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: 'user'
        }
      }
    })
    if (error) throw error
    return data
  }

  // Sign in with Google OAuth (replaces your Rails OAuth)
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  // Get user profile from your users table (includes role)
  // Handle both UUID and integer ID types
  const getUserProfile = async () => {
    if (!user.value) return null
    
    try {
      // First try to find by UUID (Supabase auth ID)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.value.id)
        .single()
      
      if (!error && data) {
        return data
      }

      // If that fails, try to find by email (fallback for migrated users)
      if (user.value.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.value.email)
          .single()
        
        if (!emailError && emailData) {
          return emailData
        }
      }

      // If user doesn't exist in public.users table, create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.value.id,
          email: user.value.email,
          name: user.value.user_metadata?.name || user.value.email?.split('@')[0] || 'User',
          role: 'user'
        } as any)
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user profile:', createError)
        throw createError
      }
      
      return newUser
    } catch (error) {
      console.error('Error in getUserProfile:', error)
      throw error
    }
  }

  // Check if user is admin (from your users table, not metadata)
  const isAdmin = computed(() => {
    // We'll need to fetch the user profile to get the role
    // This will be reactive when the profile is loaded
    return false // Placeholder - will be properly implemented
  })

  // Better admin check that actually queries your users table
  const checkIsAdmin = async () => {
    if (!user.value) return false
    
    try {
      const profile = await getUserProfile()
      return (profile as any)?.role === 'admin'
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Check if user is authenticated
  const isAuthenticated = computed(() => {
    return !!user.value
  })

  // Update user profile
  const updateUserProfile = async (updates: any) => {
    if (!user.value) throw new Error('Not authenticated')
    
    // Try to update by UUID first, then by email
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', user.value.id)
        .select()
        .single()
      
      if (!error) return data
      
      // Fallback to email-based update
      if (user.value.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          } as any)
          .eq('email', user.value.email)
          .select()
          .single()
        
        if (emailError) throw emailError
        return emailData
      }
      
      throw error
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }

  return {
    user,
    isAdmin,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    getUserProfile,
    updateUserProfile,
    checkIsAdmin
  }
} 