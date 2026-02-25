import { useEffect } from 'react';

/**
 * Loads Microsoft Clarity for heatmaps and session replay (optional).
 * Set PUBLIC_CLARITY_PROJECT_ID in .env to enable. Get the ID from
 * https://clarity.microsoft.com → Project → Settings → Setup.
 */
export default function ClarityInit() {
  useEffect(() => {
    const projectId = import.meta.env.PUBLIC_CLARITY_PROJECT_ID;
    if (!projectId || typeof document === 'undefined') return;

    (window as any).clarity =
      (window as any).clarity ||
      function () {
        ((window as any).clarity.q = (window as any).clarity.q || []).push(arguments);
      };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
