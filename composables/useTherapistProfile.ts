export const useTherapistProfile = () => {
  const api = useApi()

  const getMyProfile = () =>
    api.get<any>('/therapist/profile/me')

  const updateProfile = (data: any) =>
    api.put<any>('/therapist/profile/me', data)

  const updateAvailability = (slots: any[]) =>
    api.put<any[]>('/therapist/availability', { slots })

  const uploadDocument = (formData: FormData) =>
    api.upload<any>('/therapist/documents', formData)

  const getDocuments = () =>
    api.get<any[]>('/therapist/documents')

  const deleteDocument = (id: string) =>
    api.delete<void>(`/therapist/documents/${id}`)

  const updateSpecialties = (specialties: any[]) =>
    api.put<any[]>('/therapist/specialties', { specialties })

  const updateLanguages = (languages: any[]) =>
    api.put<any[]>('/therapist/languages', { languages })

  const toggleAvailability = (isAvailable: boolean) =>
    api.put<any>('/therapist/profile/availability', { isAvailable })

  return {
    getMyProfile, updateProfile, updateAvailability, uploadDocument,
    getDocuments, deleteDocument, updateSpecialties, updateLanguages, toggleAvailability,
  }
}
