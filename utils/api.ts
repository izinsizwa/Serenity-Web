export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private getHeaders(isFormData = false): HeadersInit {
    const token = useCookie('serenity_token').value
    const headers: HeadersInit = {}
    if (!isFormData) headers['Content-Type'] = 'application/json'
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }


private async handleError(res: Response): Promise<never> {
  const responseText = await res.text()
  let message = ''

  if (responseText) {
    try {
      const err = JSON.parse(responseText)

      if (err?.errors && typeof err.errors === 'object') {
        message = Object.values(err.errors)
          .flat()
          .filter(Boolean)
          .join('\n')
      }

      message ||= 
        err?.errorMessage ||
        err?.message ||
        err?.error ||
        err?.title ||
        ''
    } catch {
      message = responseText
    }
  }

  throw new Error(
    message || `HTTP ${res.status}: ${res.statusText || 'Request failed'}`
  )
}


  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (!res.ok) await this.handleError(res)
    return res.json() as Promise<T>
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) await this.handleError(res)
    return res.json() as Promise<T>
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) await this.handleError(res)
    return res.json() as Promise<T>
  }

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!res.ok) await this.handleError(res)
    return res.json() as Promise<T>
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<{ data: T; message: string; success: boolean }> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    })
    if (!res.ok) await this.handleError(res)
    return res.json() as Promise<{ data: T; message: string; success: boolean }>
  }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  return new ApiClient(config.public.apiBase)
}