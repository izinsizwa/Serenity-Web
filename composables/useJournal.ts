import type { JournalEntry, CreateJournalEntryRequest, PaginatedResponse } from '~/types'

export const useJournal = () => {
  const api = useApi()

  const getEntries = (page = 1, pageSize = 20) =>
    api.get<PaginatedResponse<JournalEntry>>(`/journal?page=${page}&pageSize=${pageSize}`)

  const getEntryById = (id: string) =>
    api.get<JournalEntry>(`/journal/${id}`)

  const createEntry = (data: CreateJournalEntryRequest) =>
    api.post<JournalEntry>('/journal', data)

  const updateEntry = (id: string, data: Partial<CreateJournalEntryRequest>) =>
    api.put<JournalEntry>(`/journal/${id}`, data)

  const deleteEntry = (id: string) =>
    api.delete<void>(`/journal/${id}`)

  return { getEntries, getEntryById, createEntry, updateEntry, deleteEntry }
}
