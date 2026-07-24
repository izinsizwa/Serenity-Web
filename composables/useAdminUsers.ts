export const useAdminUsers = () => {
  const api = useApi()
  const getUsers = (page = 1, pageSize = 20, search?: string, role?: number) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (search) q.append('search', search)
    if (role != null) q.append('role', String(role))
    return api.get<{ items: any[]; totalCount: number; totalPages: number }>(`/admin/users?${q}`)
  }
  const getUserById    = (id: string) => api.get<any>(`/admin/users/${id}`)
  const toggleActive   = (id: string, isActive: boolean) => api.put<any>(`/admin/users/${id}/status`, { isActive })
  const deleteUser     = (id: string) => api.delete<void>(`/admin/users/${id}`)
  return { getUsers, getUserById, toggleActive, deleteUser }
}
