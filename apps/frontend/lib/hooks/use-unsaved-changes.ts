/**
 * React Hook: Unsaved Changes Warning
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Adds beforeunload listener when form has unsaved changes.
 * Shows browser confirmation dialog when user tries to navigate away.
 * Also intercepts link clicks to confirm before client-side navigation.
 */

import { useEffect } from 'react';

/**
 * Hook that warns users about unsaved changes when navigating away
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    // Handle browser navigation (refresh, close tab, etc.)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Handle Next.js client-side navigation via link clicks
  useEffect(() => {
    if (!isDirty) return;

    const handleClick = (e: MouseEvent) => {
      // Check if the click target is a link
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        // Check if it's an internal link (not external, not hash)
        const url = new URL(link.href, window.location.origin);
        const isInternal = url.origin === window.location.origin;
        const isDifferentPage = url.pathname !== window.location.pathname;
        
        if (isInternal && isDifferentPage) {
          // Confirm before navigating
          if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isDirty]);
}
