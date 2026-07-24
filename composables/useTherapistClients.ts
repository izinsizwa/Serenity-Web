export const useTherapistClients = () => {
  const api = useApi()

  const getMyClients = (page = 1, pageSize = 20, search?: string) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (search) q.append('search', search)
    return api.get<{ items: any[]; totalCount: number; totalPages: number }>(`/therapist/clients?${q}`)
  }

  const getClientById = (clientId: string) =>
    api.get<any>(`/therapist/clients/${clientId}`)

  const getClientMoodHistory = (clientId: string, period = 'month') =>
    api.get<any>(`/therapist/clients/${clientId}/mood?period=${period}`)

  const getClientAppointments = (clientId: string) =>
    api.get<any[]>(`/therapist/clients/${clientId}/appointments`)

  const getClientJournalEntries = (clientId: string) =>
    api.get<any[]>(`/therapist/clients/${clientId}/journal`)

  const getClientGoals = (clientId: string) =>
    api.get<any[]>(`/therapist/clients/${clientId}/goals`)

  const getClientAssessments = (clientId: string) =>
    api.get<any[]>(`/therapist/clients/${clientId}/assessments`)

  const updateTreatmentNotes = (clientId: string, notes: string) =>
    api.put<any>(`/therapist/clients/${clientId}/treatment-notes`, { notes })

  return {
    getMyClients, getClientById, getClientMoodHistory,
    getClientAppointments, getClientJournalEntries,
    getClientGoals, getClientAssessments, updateTreatmentNotes,
  }
}
