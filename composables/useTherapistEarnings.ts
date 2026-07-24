export const useTherapistEarnings = () => {
  const api = useApi()

  const getEarningsSummary = (period: 'week' | 'month' | 'year' = 'month') =>
    api.get<{
      total: number; platformFee: number; netAmount: number
      sessionCount: number; avgPerSession: number
      byMonth: { month: string; amount: number; sessions: number }[]
    }>(`/therapist/earnings/summary?period=${period}`)

  const getPaymentHistory = (page = 1, pageSize = 20) =>
    api.get<{ items: any[]; totalPages: number; totalCount: number }>(
      `/therapist/earnings/payments?page=${page}&pageSize=${pageSize}`
    )

  const getMedicalAidClaims = (page = 1) =>
    api.get<{ items: any[]; totalPages: number }>(
      `/therapist/earnings/claims?page=${page}`
    )

  return { getEarningsSummary, getPaymentHistory, getMedicalAidClaims }
}
