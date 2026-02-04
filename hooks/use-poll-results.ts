'use client';

import { useEffect, useState } from 'react';
import { getResults } from '@/lib/api';

export function usePollResults(
  pollId: string,
  question: string,
  enabled: boolean = true,
  interval: number = 2000
) {
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        const data = await getResults(pollId);
        setResults(data[question] || {});
        setError(null);
      } catch (err) {
        setError('Failed to fetch results');
        console.error('Poll results error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchResults();

    // Set up interval for subsequent fetches
    const timer = setInterval(fetchResults, interval);
    return () => clearInterval(timer);
  }, [pollId, question, enabled, interval]);

  return { results, loading, error };
}
