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

  // Get user profile from your users table using supabase_auth_id mapping
  const getUserProfile = async () => {
    if (!user.value) return null
    
    try {
      // Look up user by supabase_auth_id
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', user.value.id)
        .single()
      
      if (!error && data) {
        return data
      }

      // If not found, try to find by email (for migration scenarios)
      if (user.value.email) {
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.value.email)
          .is('supabase_auth_id', null)
          .single()
        
        if (!emailError && emailData) {
          // Link this existing user to the current auth user
          const { error: linkError } = await supabase
            .from('users')
            .update({ supabase_auth_id: user.value.id })
            .eq('id', emailData.id)
          
          if (!linkError) {
            return { ...emailData, supabase_auth_id: user.value.id }
          }
        }
      }

      // If no existing user found, the auth sync plugin will handle creation
      console.log('No user profile found - will be created by auth sync')
      return null
      
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
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        } as any)
        .eq('supabase_auth_id', user.value.id)
        .select()
        .single()
      
      if (error) throw error
      return data
      
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