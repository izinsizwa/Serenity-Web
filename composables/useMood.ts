import type { MoodEntry, CreateMoodEntryRequest, PaginatedResponse } from '~/types'

export const useMood = () => {
  const api = useApi()

  const getMyMoodEntries = (from?: string, to?: string, page = 1, pageSize = 20) => {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (from) query.append('from', from)
    if (to)   query.append('to', to)
    return api.get<PaginatedResponse<MoodEntry>>(`/mood?${query}`)
  }

  const getTodaysMoodEntry = () =>
    api.get<MoodEntry | null>('/mood/today')

  const getMoodStats = (period: 'week' | 'month' | '3months' = 'week') =>
    api.get<{
      average: number
      entries: MoodEntry[]
      streakDays: number
      trend: 'improving' | 'declining' | 'stable'
    }>(`/mood/stats?period=${period}`)

  const createMoodEntry = (data: CreateMoodEntryRequest) =>
    api.post<MoodEntry>('/mood', data)

  const updateMoodEntry = (id: string, data: Partial<CreateMoodEntryRequest>) =>
    api.put<MoodEntry>(`/mood/${id}`, data)

  return {
    getMyMoodEntries,
    getTodaysMoodEntry,
    getMoodStats,
    createMoodEntry,
    updateMoodEntry,
  }
}
