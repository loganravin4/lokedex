declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, any>) => void;
      identify: (distinctId: string, properties?: Record<string, any>) => void;
      reset: () => void;
    };
  }
}

export function initPostHog(apiKey: string, apiHost: string = 'https://us.i.posthog.com'): void {
  if (typeof window === 'undefined') return;

  if (window.posthog) return;

  // PostHog's stub loader: queues calls until array.js arrives
  (function(t: any, e: any) {
    var o: any, n: any, p: any, r: any;
    e.__SV ||
      ((window.posthog = e),
      (e._i = []),
      (e.init = function(i: string, s: any, a: string) {
        function g(t: any, e: string) {
          var o = e.split('.');
          2 == o.length && ((t = t[o[0]]), (e = o[1])),
            (t[e] = function() {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            });
        }
        ((p = t.createElement('script')).type = 'text/javascript'),
          (p.async = !0),
          (p.src = s.api_host + '/static/array.js'),
          (r = t.getElementsByTagName('script')[0]).parentNode.insertBefore(p, r);
        var u = e;
        for (
          void 0 !== a ? (u = e[a] = []) : (a = 'posthog'),
            (u.people = u.people || []),
            (u.toString = function(t: any) {
              var e = 'posthog';
              return 'posthog' !== a && (e += '.' + a), t || (e += ' (stub)'), e;
            }),
            (u.people.toString = function() {
              return u.toString(1) + '.people (stub)';
            }),
            (o =
              'capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId'.split(
                ' '
              )),
            (n = 0);
          n < o.length;
          n++
        )
          g(u, o[n]);
        e._i.push([i, s, a]);
      }),
      (e.__SV = 1));
  })(document, (window as any).posthog || []);

  (window as any).posthog.init(apiKey, {
    api_host: apiHost,
    // We send $pageview via LayoutPageView; avoid duplicate autocapture pageviews
    capture_pageview: false,
    // Already the default, pinned since click maps ride on session recording
    disable_session_recording: false,
    // Anonymous visitors need person profiles for retention/lifecycle reports
    person_profiles: 'always',
  });
}

export function trackPageView(pageName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('$pageview', {
    page_name: pageName,
    ...properties,
  });
}

export function trackNavigationClick(destination: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('navigation_click', {
    destination,
    location: 'navbar',
  });
}

export function trackCTAClick(buttonName: string, location: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('cta_click', {
    button_name: buttonName,
    location,
  });
}

export function trackProjectClick(projectName: string, action: 'view' | 'github' | 'demo'): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('project_interaction', {
    project_name: projectName,
    action,
  });
}

export function trackExternalLink(platform: string, url: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('external_link_click', {
    platform,
    url,
  });
}

export function trackFormEvent(eventType: 'started' | 'submitted' | 'error', formName: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('form_interaction', {
    event_type: eventType,
    form_name: formName,
  });
}

export function trackScrollDepth(depth: number): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('scroll_depth', {
    depth_percentage: depth,
  });
}

export function trackSectionView(sectionName: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('section_view', {
    section_name: sectionName,
  });
}

export function trackTechClick(techName: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('tech_click', {
    tech_name: techName,
  });
}

export function trackTitleView(title: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('title_view', {
    title_text: title,
  });
}

export function trackTimeOnPage(seconds: number, pageName: string): void {
  if (typeof window === 'undefined' || !window.posthog) return;
  
  window.posthog.capture('time_on_page', {
    seconds,
    page_name: pageName,
  });
}

