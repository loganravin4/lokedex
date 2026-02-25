import { useEffect } from 'react';
import { trackPageView } from '../../lib/analytics';

/**
 * Sends a single $pageview on mount so every page (including those without
 * AnalyticsTracker) is counted. Required for PostHog Lifecycle / Growth
 * accounting to show data. Runs once per page load.
 */
export default function LayoutPageView() {
  useEffect(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const pageName = pathname === '' || pathname === '/' ? 'Home' : pathname.replace(/^\/|\/$/g, '') || 'Home';
    trackPageView(pageName, { path: pathname || '/' });
  }, []);

  return null;
}
