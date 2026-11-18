export interface HealthResponse {
  status: 'ok'
}

export async function getBackendHealth(): Promise<HealthResponse> {
  const response = await fetch('/health', {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Backend health check failed: ${response.status}`)
  }

  return response.json() as Promise<HealthResponse>
}
