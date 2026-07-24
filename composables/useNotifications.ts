import type { Notification, PaginatedResponse } from '~/types'

export const useNotifications = () => {
  const api = useApi()

  const getNotifications = (unreadOnly = false, page = 1) =>
    api.get<PaginatedResponse<Notification>>(`/notifications?unreadOnly=${unreadOnly}&page=${page}`)

  const markAsRead = (id: string) =>
    api.put<void>(`/notifications/${id}/read`, {})

  const markAllAsRead = () =>
    api.put<void>('/notifications/read-all', {})

  const getUnreadCount = () =>
    api.get<{ count: number }>('/notifications/unread-count')

  return { getNotifications, markAsRead, markAllAsRead, getUnreadCount }
}
