/**
 * React Hook: Unsaved Changes Warning
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Adds beforeunload listener when form has unsaved changes.
 * Shows browser confirmation dialog when user tries to navigate away.
 */

import { useEffect } from 'react';

/**
 * Hook that warns users about unsaved changes when navigating away
 *
 * @param isDirty - Whether the form has unsaved changes
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
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
}
