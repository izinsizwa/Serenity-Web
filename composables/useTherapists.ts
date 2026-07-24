import type { Therapist, TherapistSearchParams, PaginatedResponse, Availability } from '~/types'

export const useTherapists = () => {
  const api = useApi()

  const searchTherapists = (params?: TherapistSearchParams) => {
    const query = new URLSearchParams()
    if (params?.search)           query.append('search', params.search)
    if (params?.specialty)        query.append('specialty', params.specialty)
    if (params?.province)         query.append('province', params.province)
    if (params?.city)             query.append('city', params.city)
    if (params?.sessionFormat)    query.append('sessionFormat', params.sessionFormat)
    if (params?.minFee != null)   query.append('minFee', String(params.minFee))
    if (params?.maxFee != null)   query.append('maxFee', String(params.maxFee))
    if (params?.acceptsMedicalAid != null) query.append('acceptsMedicalAid', String(params.acceptsMedicalAid))
    if (params?.isAvailable != null)       query.append('isAvailable', String(params.isAvailable))
    if (params?.language)         query.append('language', params.language)
    if (params?.page)             query.append('page', String(params.page))
    if (params?.pageSize)         query.append('pageSize', String(params.pageSize))
    const qs = query.toString()
    return api.get<PaginatedResponse<Therapist>>(`/therapists${qs ? '?' + qs : ''}`)
  }

  const getTherapistById = (id: string) =>
    api.get<Therapist>(`/therapists/${id}`)

  const getTherapistAvailability = (id: string) =>
    api.get<Availability[]>(`/therapists/${id}/availability`)

  const getMyMatchedTherapists = () =>
    api.get<Therapist[]>('/therapists/my-matches')

  return {
    searchTherapists,
    getTherapistById,
    getTherapistAvailability,
    getMyMatchedTherapists,
  }
}
