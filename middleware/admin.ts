export default defineNuxtRouteMiddleware(async () => {
  const { user, initAuth, checkIsAdmin } = useAuth()

  await initAuth()

  if (!user.value) {
    return navigateTo('/login')
  }

  if (!checkIsAdmin()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin access required.',
    })
  }
})
