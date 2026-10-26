import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr'

export const useSignalR = (hubPath: string) => {
  const config = useRuntimeConfig()
  const token = useCookie('auth_token') // Adjust based on where you store your JWT token[cite: 1]

  const connection: HubConnection = new HubConnectionBuilder()
    .withUrl(`${config.public.apiBase.replace('/api', '')}${hubPath}`, {
      accessTokenFactory: () => token.value || ''
    })
    .withAutomaticReconnect()
    .build()

  return { connection }
}