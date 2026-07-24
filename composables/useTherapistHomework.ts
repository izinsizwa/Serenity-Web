export const useTherapistHomework = () => {
  const api = useApi()

  const getAssignments = (page = 1, status?: number) => {
    const q = new URLSearchParams({ page: String(page) })
    if (status != null) q.append('status', String(status))
    return api.get<{ items: any[]; totalPages: number }>(`/therapist/homework?${q}`)
  }

  const getAssignmentById = (id: string) =>
    api.get<any>(`/therapist/homework/${id}`)

  const createAssignment = (data: {
    appointmentId: string; clientId: string; title: string
    description: string; type: number; dueDate: string
  }) => api.post<any>('/therapist/homework', data)

  const reviewAssignment = (id: string, feedback: string, rating?: number) =>
    api.put<any>(`/therapist/homework/${id}/review`, { therapistFeedback: feedback, rating })

  return { getAssignments, getAssignmentById, createAssignment, reviewAssignment }
}
