export const useAdminVerifications = () => {
  const api = useApi()
  const getPendingVerifications = (page = 1) =>
    api.get<{ items: any[]; totalPages: number }>(`/admin/verifications/pending?page=${page}`)
  const approveTherapist = (therapistId: string, notes?: string) =>
    api.put<any>(`/admin/verifications/${therapistId}/approve`, { notes })
  const rejectTherapist  = (therapistId: string, reason: string) =>
    api.put<any>(`/admin/verifications/${therapistId}/reject`, { reason })
  return { getPendingVerifications, approveTherapist, rejectTherapist }
}
