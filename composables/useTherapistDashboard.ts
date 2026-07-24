export const useTherapistDashboard = () => {
  const api = useApi()

  const getDashboardStats = () =>
    api.get<{
      todaysSessions:    number
      activeClients:     number
      pendingHomework:   number
      monthlyEarnings:   number
      unreadMessages:    number
      crisisAlerts:      number
      upcomingToday:     any[]
      recentActivity:    any[]
    }>('/therapist/dashboard/stats')

  const getTodaysSchedule = () =>
    api.get<any[]>('/therapist/appointments/today')

  const getPendingActions = () =>
    api.get<{
      homeworkToReview:    number
      unreadMessages:      number
      pendingAssessments:  number
      crisisAlerts:        any[]
    }>('/therapist/pending-actions')

  return { getDashboardStats, getTodaysSchedule, getPendingActions }
}
