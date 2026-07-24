export const useAdminCrisis = () => {
  const api = useApi()
  const getAlerts    = (status?: number) => api.get<any[]>(`/admin/crisis${status != null ? `?status=${status}` : ''}`)
  const resolveAlert = (id: string, notes: string) => api.put<any>(`/admin/crisis/${id}/resolve`, { resolutionNotes: notes })
  const escalate     = (id: string) => api.put<any>(`/admin/crisis/${id}/escalate`, {})
  return { getAlerts, resolveAlert, escalate }
}
