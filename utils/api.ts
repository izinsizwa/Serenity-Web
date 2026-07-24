class ApiClient {
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

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const message = err?.errors
        ? Object.values(err.errors).flat().join(', ')
        : err?.message || err?.error || `HTTP ${res.status}`
      throw new Error(message)
    }
    return res.json() as Promise<T>
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const message = err?.errors
        ? Object.values(err.errors).flat().join(', ')
        : err?.message || err?.error || `HTTP ${res.status}`
      throw new Error(message)
    }
    return res.json() as Promise<T>
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const message = err?.errors
        ? Object.values(err.errors).flat().join(', ')
        : err?.message || err?.error || `HTTP ${res.status}`
      throw new Error(message)
    }
    return res.json() as Promise<T>
  }

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      const message = err?.errors
        ? Object.values(err.errors).flat().join(', ')
        : err?.message || err?.error || `HTTP ${res.status}`
      throw new Error(message)
    }
    return res.json() as Promise<T>
  }

  async upload<T>(endpoint: string, formData: FormData): Promise<{ data: T; message: string; success: boolean }> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: formData,
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(err || `HTTP ${res.status}`)
    }
    return res.json() as Promise<{ data: T; message: string; success: boolean }>
  }
}

export const useApi = () => {
  const config = useRuntimeConfig()
  return new ApiClient(config.public.apiBase)
}