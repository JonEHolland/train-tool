import { useState, useEffect, useCallback } from 'react';

export interface PollingState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook for polling data at a regular interval.
 *
 * @param fetcher - Async function that fetches and returns the data
 * @param initialData - Initial data value before first fetch
 * @param intervalMs - Polling interval in milliseconds
 * @param errorMessage - Error message to show on fetch failure
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  initialData: T,
  intervalMs: number,
  errorMessage: string
): PollingState<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch {
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetcher, errorMessage]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { data, loading, error, refetch: fetchData };
}
