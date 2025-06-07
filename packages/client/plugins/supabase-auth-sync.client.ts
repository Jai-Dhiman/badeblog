export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Function to sync Supabase auth user with your existing users table
  const syncUserProfile = async (authUser: any) => {
    if (!authUser) return

    try {
      // Check if user exists in your users table
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching user profile:', fetchError)
        return
      }

      if (!existingUser) {
        // Create new user record in your existing users table structure
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.id, // Use the same UUID from auth.users
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'user', // Default role, matching your Rails structure
            provider: authUser.app_metadata?.provider || null,
            uid: authUser.app_metadata?.provider_uid || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Add password_digest as null since Supabase handles auth
            password_digest: null
          })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
        } else {
          console.log('Created new user profile for:', authUser.email)
        }
      } else {
        // Update existing user record if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: authUser.email,
            name: authUser.user_metadata?.name || existingUser.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.id)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
        }
      }
    } catch (error) {
      console.error('Error syncing user profile:', error)
    }
  }

  // Sync user on initial load if already authenticated
  if (user.value) {
    await syncUserProfile(user.value)
  }

  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event: string, session: any) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await syncUserProfile(session.user)
    }
  })
}) 