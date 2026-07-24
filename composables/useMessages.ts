import type { Message, Conversation, SendMessageRequest, PaginatedResponse } from '~/types'

export const useMessages = () => {
  const api = useApi()

  const getConversations = () =>
    api.get<Conversation[]>('/messages/conversations')

  const getConversation = (otherUserId: string, page = 1, pageSize = 50) =>
    api.get<PaginatedResponse<Message>>(`/messages/conversation/${otherUserId}?page=${page}&pageSize=${pageSize}`)

  const sendMessage = (data: SendMessageRequest) =>
    api.post<Message>('/messages', data)

  const markAsRead = (otherUserId: string) =>
    api.put<void>(`/messages/conversation/${otherUserId}/read`, {})

  const getUnreadCount = () =>
    api.get<{ count: number }>('/messages/unread-count')

  return { getConversations, getConversation, sendMessage, markAsRead, getUnreadCount }
}
