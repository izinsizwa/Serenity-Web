import type { MedicalAidProvider } from '~/types'

export interface MedicalAidDetails {
  providerId:       string
  providerName:     string
  membershipNumber: string
  planName:         string
  dependantCode:    string | null
  mainMemberName:   string | null
  isActive:         boolean
  isVerified:       boolean
}

export interface MedicalAidClaim {
  claimId:              string
  paymentId:            string
  appointmentId:        string | null
  providerId:           string
  providerName:         string
  claimNumber:          string | null
  amount:               number
  coveredAmount:        number | null
  copayAmount:          number | null
  status:               number   // 0=Submitted 1=Processing 2=Approved 3=Rejected 4=Paid
  submittedAt:          string
  processedAt:          string | null
  therapistName:        string | null
  sessionDate:          string | null
  rejectionReason:      string | null
}

export const useMedicalAid = () => {
  const api = useApi()

  // Providers
  const getProviders = () =>
    api.get<MedicalAidProvider[]>('/medical-aid-providers')

  // Client's medical aid details
  const getMyMedicalAid = () =>
    api.get<MedicalAidDetails | null>('/clients/me/medical-aid')

  const updateMyMedicalAid = (data: Partial<MedicalAidDetails>) =>
    api.put<MedicalAidDetails>('/clients/me/medical-aid', data)

  const verifyMedicalAid = () =>
    api.post<{ verified: boolean; message: string }>('/clients/me/medical-aid/verify', {})

  // Claims
  const getMyClaims = (page = 1, pageSize = 10, status?: number) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status != null) q.append('status', String(status))
    return api.get<{ items: MedicalAidClaim[]; totalPages: number; totalCount: number }>(
      `/clients/me/medical-aid/claims?${q}`
    )
  }

  const getClaimById = (id: string) =>
    api.get<MedicalAidClaim>(`/clients/me/medical-aid/claims/${id}`)

  const submitClaim = (paymentId: string) =>
    api.post<MedicalAidClaim>('/clients/me/medical-aid/claims', { paymentId })

  // Coverage check for a therapist
  const checkCoverage = (therapistId: string) =>
    api.get<{
      isCovered:     boolean
      coverageAmount: number | null
      copayAmount:    number | null
      notes:         string | null
    }>(`/clients/me/medical-aid/coverage-check?therapistId=${therapistId}`)

  // Admin — provider management
  const adminGetProviders = (page = 1) =>
    api.get<{ items: MedicalAidProvider[]; totalPages: number }>(
      `/admin/medical-aid-providers?page=${page}`
    )

  const adminCreateProvider = (data: Partial<MedicalAidProvider>) =>
    api.post<MedicalAidProvider>('/admin/medical-aid-providers', data)

  const adminUpdateProvider = (id: string, data: Partial<MedicalAidProvider>) =>
    api.put<MedicalAidProvider>(`/admin/medical-aid-providers/${id}`, data)

  const adminToggleProvider = (id: string, isActive: boolean) =>
    api.put<MedicalAidProvider>(`/admin/medical-aid-providers/${id}/status`, { isActive })

  return {
    getProviders,
    getMyMedicalAid, updateMyMedicalAid, verifyMedicalAid,
    getMyClaims, getClaimById, submitClaim, checkCoverage,
    adminGetProviders, adminCreateProvider, adminUpdateProvider, adminToggleProvider,
  }
}
