export const useTherapistCalendar = () => {
  const api = useApi()

  const getAppointments = (from: string, to: string) =>
    api.get<any[]>(`/therapist/appointments?from=${from}&to=${to}`)

  const getAvailability = () =>
    api.get<any[]>('/therapist/availability')

  const updateAvailability = (slots: any[]) =>
    api.put<any[]>('/therapist/availability', { slots })

  const blockTime = (data: { startDateTime: string; endDateTime: string; reason?: string }) =>
    api.post<any>('/therapist/availability/block', data)

  const getAppointmentById = (id: string) =>
    api.get<any>(`/therapist/appointments/${id}`)

  const updateSessionNotes = (appointmentId: string, notes: string) =>
    api.put<any>(`/therapist/appointments/${appointmentId}/session-notes`, { sessionNotes: notes })

  const completeSession = (appointmentId: string, data: { sessionNotes: string; requiresFollowUp: boolean; suggestedFollowUpDate?: string }) =>
    api.put<any>(`/therapist/appointments/${appointmentId}/complete`, data)

  return {
    getAppointments, getAvailability, updateAvailability,
    blockTime, getAppointmentById, updateSessionNotes, completeSession,
  }
}
