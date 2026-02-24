import { useState, useEffect, useCallback } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval = 5000,
  immediate = true
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (e: any) {
      setError(e.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  useEffect(() => {
    if (immediate) fetch()
    const id = setInterval(fetch, interval)
    return () => clearInterval(id)
  }, [fetch, interval, immediate])

  return { data, loading, error, refetch: fetch }
}
