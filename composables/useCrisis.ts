import type { CrisisAlert } from '~/types'

export const useCrisis = () => {
  const api = useApi()

  const triggerAlert = (data: {
    type: number
    severity: number
    clientMessage: string
    latitude?: string
    longitude?: string
  }) => api.post<CrisisAlert>('/crisis', data)

  const getMyCrisisHistory = () =>
    api.get<CrisisAlert[]>('/crisis/my')

  return { triggerAlert, getMyCrisisHistory }
}
