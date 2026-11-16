import { useEffect } from 'react';
import { trackPageView } from '../../lib/analytics';

/** Counts every page, not just AnalyticsTracker ones, so PostHog Lifecycle has data. */
export default function LayoutPageView() {
  useEffect(() => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const pageName = pathname === '' || pathname === '/' ? 'Home' : pathname.replace(/^\/|\/$/g, '') || 'Home';
    trackPageView(pageName, { path: pathname || '/' });
  }, []);

  return null;
}
