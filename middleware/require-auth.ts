export default defineNuxtRouteMiddleware(async () => {
  const { user, initAuth } = useAuth()

  await initAuth()

  if (!user.value) {
    return navigateTo('/login')
  }
})
