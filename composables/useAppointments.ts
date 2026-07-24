import type { Appointment, BookAppointmentRequest, AppointmentQueryParams, ApiResponse, PaginatedResponse, CreateReviewRequest } from '~/types'

export const useAppointments = () => {
  const api = useApi()

  const getMyAppointments = (params?: AppointmentQueryParams) => {
    const query = new URLSearchParams()
    if (params?.status)   query.append('status', params.status)
    if (params?.from)     query.append('from', params.from)
    if (params?.to)       query.append('to', params.to)
    if (params?.page)     query.append('page', String(params.page))
    if (params?.pageSize) query.append('pageSize', String(params.pageSize))
    const qs = query.toString()
    return api.get<PaginatedResponse<Appointment>>(`/appointments/my${qs ? '?' + qs : ''}`)
  }

  const getUpcomingAppointments = () =>
    api.get<Appointment[]>('/appointments/my/upcoming')

  const getAppointmentById = (id: string) =>
    api.get<Appointment>(`/appointments/${id}`)

  const bookAppointment = (data: BookAppointmentRequest) =>
    api.post<Appointment>('/appointments', data)

  const cancelAppointment = (id: string, reason: string) =>
    api.put<Appointment>(`/appointments/${id}/cancel`, { reason })

  const rescheduleAppointment = (id: string, newDateTime: string) =>
    api.put<Appointment>(`/appointments/${id}/reschedule`, { scheduledDateTime: newDateTime })

  const joinVideoCall = (id: string) =>
    api.get<{ videoCallLink: string; videoCallId: string }>(`/appointments/${id}/join`)

  const submitReview = (data: CreateReviewRequest) =>
    api.post<void>('/reviews', data)

  const getAvailableSlots = (therapistId: string, date: string) =>
    api.get<string[]>(`/therapists/${therapistId}/available-slots?date=${date}`)

  return {
    getMyAppointments,
    getUpcomingAppointments,
    getAppointmentById,
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    joinVideoCall,
    submitReview,
    getAvailableSlots,
  }
}
