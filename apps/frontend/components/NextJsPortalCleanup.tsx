'use client';

import { useEffect } from 'react';

/**
 * Cleans up Next.js DevTools portal elements that cause console errors
 */
export default function NextJsPortalCleanup() {
  useEffect(() => {
    // Remove nextjs-portal elements
    const cleanup = () => {
      const portals = document.querySelectorAll('nextjs-portal');
      portals.forEach((portal) => {
        portal.remove();
      });
    };

    // Run immediately
    cleanup();

    // Also run after a short delay to catch dynamically added elements
    const timeout = setTimeout(cleanup, 100);

    // Cleanup function
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return null;
}

