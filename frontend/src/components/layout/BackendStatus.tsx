import { useQuery } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { getBackendHealth } from '../../lib/health'

export default function BackendStatus() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['backend', 'health'],
    queryFn: getBackendHealth,
    refetchInterval: 30_000,
    retry: 1,
  })

  if (isPending) {
    return (
      <div className="backend-status backend-status--checking" role="status">
        <LoaderCircle size={14} className="backend-status-spinner" />
        <span>Checking API</span>
      </div>
    )
  }

  if (isError || data?.status !== 'ok') {
    return (
      <div
        className="backend-status backend-status--unavailable"
        role="status"
        title="Unable to connect to the backend API"
      >
        <CircleAlert size={14} />
        <span>API unavailable</span>
      </div>
    )
  }

  return (
    <div
      className="backend-status backend-status--connected"
      role="status"
      title="Backend API is healthy"
    >
      <CircleCheck size={14} />
      <span>API connected</span>
    </div>
  )
}
