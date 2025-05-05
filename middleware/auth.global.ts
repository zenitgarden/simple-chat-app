export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  const publicPages = ['/login', '/signup']

  if (!loggedIn.value && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }
})