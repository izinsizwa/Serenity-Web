import { defineStore } from 'pinia'
import { UserRole, type AccountUser, type LoginRequest, type RegisterRequest, type AuthResponse } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user      = ref<AccountUser | null>(null)
  const token     = useCookie<string | null>('serenity_token', { maxAge: 60 * 60 * 24 * 7 })
  const isLoading = ref(false)
  const error     = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isClient        = computed(() => user.value?.role === UserRole.Client)
  const isTherapist     = computed(() => user.value?.role === UserRole.Therapist || user.value?.role === UserRole.ClinicTherapist)
  const isAdmin         = computed(() => user.value?.role === UserRole.Admin || user.value?.role === UserRole.SuperAdmin)
  const isClinicAdmin   = computed(() => user.value?.role === UserRole.ClinicAdmin)
  const fullName        = computed(() => user.value ? `${user.value.firstName} ${user.value.lastName}` : '')

  const portalRoute = computed(() => {
    if (!user.value) return '/auth/login'
    switch (user.value.role) {
      case UserRole.Client:          return '/client/dashboard'
      case UserRole.Therapist:       return '/therapist/dashboard'
      case UserRole.ClinicTherapist: return '/therapist/dashboard'
      case UserRole.ClinicAdmin:     return '/clinic/dashboard'
      case UserRole.Admin:
      case UserRole.SuperAdmin:      return '/admin/dashboard'
      default:                       return '/auth/login'
    }
  })

  async function login(credentials: LoginRequest) {
    isLoading.value = true
    error.value = null
    try {
      const api = useApi()
      const res = await api.post<{ token: string; refreshToken: string; user: AccountUser }>('/auth/login', credentials)
      token.value = res.token
      user.value  = res.user
      return res
    } catch (e: any) {
      error.value = e.message || 'Login failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function register(data: RegisterRequest) {
    isLoading.value = true
    error.value = null
    try {
      const api = useApi()
      const endpoint = data.role === UserRole.Therapist
        ? '/auth/register/therapist'
        : '/auth/register/client'
      const res = await api.post<AuthResponse>(endpoint, data)
      token.value = res.token
      user.value  = res.user
      return res
    } catch (e: any) {
      error.value = e.message || 'Registration failed'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const api = useApi()
      user.value = await api.get<AccountUser>('/auth/me')
    } catch {
      logout()
    }
  }

  function logout() {
    user.value  = null
    token.value = null
    navigateTo('/auth/login')
  }

  return {
    user, token, isLoading, error,
    isAuthenticated, isClient, isTherapist,
    isAdmin, isClinicAdmin, fullName, portalRoute,
    login, register, fetchMe, logout,
  }
})