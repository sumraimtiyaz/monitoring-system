/**
 * usePolling Hook - Handles periodic data fetching with loading and error states.
 */
import { useState, useEffect, useCallback, useRef } from 'react'

export interface UsePollingOptions {
  /** Polling interval in milliseconds */
  interval?: number
  /** Whether to fetch immediately on mount */
  immediate?: boolean
  /** Callback on error */
  onError?: (error: Error) => void
  /** Callback on success */
  onSuccess?: (data: unknown) => void
}

export interface UsePollingResult<T> {
  /** The fetched data */
  data: T | null
  /** Whether data is currently being fetched */
  loading: boolean
  /** Error message if fetch failed */
  error: string | null
  /** Manual refresh function */
  refetch: () => Promise<void>
  /** Reset error state */
  resetError: () => void
}

/**
 * Custom hook for polling data at regular intervals.
 * 
 * @param fetcher - Async function that returns the data
 * @param interval - Polling interval in milliseconds (default: 5000)
 * @param immediate - Whether to fetch immediately on mount (default: true)
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval = 5000,
  immediate = true
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use ref to track if component is mounted
  const isMounted = useRef(true)
  // Use ref to track the current fetcher
  const fetcherRef = useRef(fetcher)
  
  // Update ref when fetcher changes
  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcherRef.current()
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setData(result)
        setError(null)
      }
    } catch (e) {
      if (isMounted.current) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error'
        setError(errorMessage)
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
    
    const id = setInterval(fetchData, interval)
    
    return () => {
      clearInterval(id)
    }
  }, [fetchData, interval, immediate])

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    resetError 
  }
}
