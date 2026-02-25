import { useEffect } from 'react';
import { trackScrollDepth, trackSectionView, trackTimeOnPage } from '../../lib/analytics';

interface AnalyticsTrackerProps {
  pageName: string;
}

export default function AnalyticsTracker({ pageName }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Page view is sent by LayoutPageView in BaseLayout so Lifecycle has data on all pages
    let maxScroll = 0;
    const scrollHandler = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
      
      // Track milestones: 25%, 50%, 75%, 100%
      if (scrollPercent >= 25 && maxScroll < 25) {
        trackScrollDepth(25);
        maxScroll = 25;
      } else if (scrollPercent >= 50 && maxScroll < 50) {
        trackScrollDepth(50);
        maxScroll = 50;
      } else if (scrollPercent >= 75 && maxScroll < 75) {
        trackScrollDepth(75);
        maxScroll = 75;
      } else if (scrollPercent >= 100 && maxScroll < 100) {
        trackScrollDepth(100);
        maxScroll = 100;
      }
    };

    // Track section views using Intersection Observer
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionName = entry.target.getAttribute('data-section');
            if (sectionName) {
              trackSectionView(sectionName);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all sections with data-section attribute
    document.querySelectorAll('[data-section]').forEach((section) => {
      sectionObserver.observe(section);
    });

    // Track time on page (every 30 seconds)
    let timeOnPage = 0;
    const timeInterval = setInterval(() => {
      timeOnPage += 30;
      trackTimeOnPage(timeOnPage, pageName);
    }, 30000);

    window.addEventListener('scroll', scrollHandler);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
      sectionObserver.disconnect();
      clearInterval(timeInterval);
    };
  }, [pageName]);

  return null;
}

