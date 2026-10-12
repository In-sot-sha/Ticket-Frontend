import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { isAnalyticsEnabled, trackPageView } from '../lib/analytics';

/**
 * Records page_view on React Router navigations.
 * Initial page view is already sent by the gtag snippet in index.html.
 */
const GoogleAnalytics = () => {
  const location = useLocation();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    if (!isAnalyticsEnabled()) return;
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default GoogleAnalytics;
