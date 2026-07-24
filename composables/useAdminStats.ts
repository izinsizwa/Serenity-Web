export const useAdminStats = () => {
  const api = useApi()
  const getPlatformStats = () =>
    api.get<{
      totalUsers: number; totalClients: number; totalTherapists: number
      totalSessions: number; totalRevenue: number; platformFee: number
      activeCrisisAlerts: number; pendingVerifications: number
      newUsersThisMonth: number; sessionsThisMonth: number
      revenueByMonth: { month: string; amount: number }[]
      userGrowth: { month: string; clients: number; therapists: number }[]
    }>('/admin/stats')

  const getRecentActivity = () =>
    api.get<any[]>('/admin/activity')

  return { getPlatformStats, getRecentActivity }
}
