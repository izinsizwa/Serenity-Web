import type { Goal, GoalProgress, CreateGoalRequest } from '~/types'

export const useGoals = () => {
  const api = useApi()

  const getMyGoals = (includeCompleted = false) =>
    api.get<Goal[]>(`/goals?includeCompleted=${includeCompleted}`)

  const getGoalById = (id: string) =>
    api.get<Goal>(`/goals/${id}`)

  const createGoal = (data: CreateGoalRequest) =>
    api.post<Goal>('/goals', data)

  const updateGoal = (id: string, data: Partial<CreateGoalRequest>) =>
    api.put<Goal>(`/goals/${id}`, data)

  const deleteGoal = (id: string) =>
    api.delete<void>(`/goals/${id}`)

  const logProgress = (goalId: string, progressPercentage: number, currentValue?: number, notes?: string) =>
    api.post<GoalProgress>(`/goals/${goalId}/progress`, { progressPercentage, currentValue, notes })

  const markComplete = (id: string) =>
    api.put<Goal>(`/goals/${id}/complete`, {})

  return { getMyGoals, getGoalById, createGoal, updateGoal, deleteGoal, logProgress, markComplete }
}
