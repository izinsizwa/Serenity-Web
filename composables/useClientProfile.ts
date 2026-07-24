import type { Client, AccountUser } from '~/types'

export const useClientProfile = () => {
  const api = useApi()

  const getMyProfile = () =>
    api.get<Client>('/clients/me')

  const updateMyProfile = (data: Partial<Client>) =>
    api.put<Client>('/clients/me', data)

  const updateAccountInfo = (data: Partial<AccountUser>) =>
    api.put<AccountUser>('/account/me', data)

  const updateProfilePicture = (formData: FormData) =>
    api.upload<{ profilePictureUrl: string }>('/account/me/avatar', formData)

  const changePassword = (currentPassword: string, newPassword: string) =>
    api.post<void>('/account/change-password', { currentPassword, newPassword })

  const getWearableDevices = () =>
    api.get<any[]>('/wearables')

  const connectWearable = (deviceType: string, accessToken: string) =>
    api.post<any>('/wearables/connect', { deviceType, accessToken })

  const disconnectWearable = (deviceId: string) =>
    api.delete<void>(`/wearables/${deviceId}`)

  return {
    getMyProfile,
    updateMyProfile,
    updateAccountInfo,
    updateProfilePicture,
    changePassword,
    getWearableDevices,
    connectWearable,
    disconnectWearable,
  }
}
