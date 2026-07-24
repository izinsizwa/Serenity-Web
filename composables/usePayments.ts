import type { Payment, PaymentMethod, MedicalAidProvider } from '~/types'

export const usePayments = () => {
  const api = useApi()

  const getMyPayments = (page = 1, pageSize = 20) =>
    api.get<{ items: Payment[]; totalCount: number }>(`/payments/my?page=${page}&pageSize=${pageSize}`)

  const getPaymentMethods = () =>
    api.get<PaymentMethod[]>('/payment-methods')

  const addPaymentMethod = (data: Partial<PaymentMethod>) =>
    api.post<PaymentMethod>('/payment-methods', data)

  const deletePaymentMethod = (id: string) =>
    api.delete<void>(`/payment-methods/${id}`)

  const setDefaultPaymentMethod = (id: string) =>
    api.put<void>(`/payment-methods/${id}/set-default`, {})

  const getMedicalAidProviders = () =>
    api.get<MedicalAidProvider[]>('/medical-aid-providers')

  return {
    getMyPayments,
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getMedicalAidProviders,
  }
}
