import type { HomeworkAssignment, HomeworkStatus, PaginatedResponse } from '~/types'

export const useHomework = () => {
  const api = useApi()

  const getMyAssignments = (status?: HomeworkStatus) => {
    const query = status != null ? `?status=${status}` : ''
    return api.get<PaginatedResponse<HomeworkAssignment>>(`/homework${query}`)
  }

  const getAssignmentById = (id: string) =>
    api.get<HomeworkAssignment>(`/homework/${id}`)

  const submitResponse = (id: string, response: string) =>
    api.put<HomeworkAssignment>(`/homework/${id}/submit`, { clientResponse: response })

  return { getMyAssignments, getAssignmentById, submitResponse }
}
