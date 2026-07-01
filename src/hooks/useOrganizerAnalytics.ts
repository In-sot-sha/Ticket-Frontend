import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { OrganizerAnalytics } from '../lib/eventOrganizer';

export function useOrganizerAnalytics() {
  const [data, setData] = useState<OrganizerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Always fetch fresh data (no caching)
    setLoading(true);
    api.events
      .getOrganizerAnalytics()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []); // Empty deps — fetch once on mount, always fresh

  return { data, loading, error };
}
