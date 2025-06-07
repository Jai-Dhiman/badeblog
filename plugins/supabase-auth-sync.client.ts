export default defineNuxtPlugin(async () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  // Function to sync Supabase auth user with your existing users table
  const syncUserProfile = async (authUser: any) => {
    if (!authUser) return

    try {
      // First, check if this auth user is already linked to an existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_auth_id', authUser.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', fetchError)
        return
      }

      if (existingUser) {
        // User already linked, update if needed
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: authUser.email,
            name: authUser.user_metadata?.name || existingUser.name,
            updated_at: new Date().toISOString()
          })
          .eq('supabase_auth_id', authUser.id)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
        }
        return
      }

      // Check if a user with this email already exists (from Rails migration)
      const { data: emailUser, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .is('supabase_auth_id', null)
        .single()

      if (emailUser) {
        // Link existing Rails user to Supabase Auth
        const { error: linkError } = await supabase
          .from('users')
          .update({
            supabase_auth_id: authUser.id,
            name: authUser.user_metadata?.name || emailUser.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', emailUser.id)

        if (linkError) {
          console.error('Error linking existing user:', linkError)
        } else {
          console.log('Linked existing user to Supabase Auth:', authUser.email)
        }
        return
      }

      // Create new user (this will get the next integer ID automatically)
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          // Don't specify ID - let PostgreSQL auto-increment handle it
          supabase_auth_id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'user',
          provider: authUser.app_metadata?.provider || null,
          uid: authUser.app_metadata?.provider_uid || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          password_digest: null // Supabase handles auth
        })

      if (insertError) {
        console.error('Error creating user profile:', insertError)
      } else {
        console.log('Created new user profile for:', authUser.email)
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