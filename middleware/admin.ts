export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, checkIsAdmin } = useAuth()

  // Check if user is authenticated
  if (!user.value) {
    return navigateTo('/auth/register')
  }

  // Check if user is admin
  const isAdmin = await checkIsAdmin()
  if (!isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. Admin access required.'
    })
  }
}) 