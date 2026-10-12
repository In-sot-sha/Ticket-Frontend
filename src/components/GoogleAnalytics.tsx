import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, isAnalyticsEnabled, trackPageView } from '../lib/analytics';

/**
 * Loads GA4 once, then records a page_view on every React Router navigation.
 * Renders nothing. Place inside <Router>.
 */
const GoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default GoogleAnalytics;
