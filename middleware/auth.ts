import { useAuthStore } from '~/stores/auth'
import { UserRole } from '~/types'

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()

  const publicRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password', '/']
  if (publicRoutes.includes(to.path)) return

  if (!auth.token) return navigateTo('/auth/login')

  if (!auth.user) await auth.fetchMe()

  if (!auth.user) return navigateTo('/auth/login')

  const path = to.path

  // Client routes
  if (path.startsWith('/client') && auth.user.role !== UserRole.Client) {
    return navigateTo(auth.portalRoute)
  }

  // Therapist routes
  if (path.startsWith('/therapist') &&
    auth.user.role !== UserRole.Therapist &&
    auth.user.role !== UserRole.ClinicTherapist) {
    return navigateTo(auth.portalRoute)
  }

  // Admin routes
  if (path.startsWith('/admin') &&
    auth.user.role !== UserRole.Admin &&
    auth.user.role !== UserRole.SuperAdmin) {
    return navigateTo(auth.portalRoute)
  }

  // Clinic routes
  if (path.startsWith('/clinic') && auth.user.role !== UserRole.ClinicAdmin) {
    return navigateTo(auth.portalRoute)
  }
})
