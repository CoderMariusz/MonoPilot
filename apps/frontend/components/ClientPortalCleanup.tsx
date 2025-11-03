'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * Cleans up Next.js DevTools portal elements that cause console errors
 * This is a client component wrapper that handles dynamic import
 */
const NextJsPortalCleanup = dynamic(
  () => import('@/components/NextJsPortalCleanup'),
  { ssr: false }
);

export default function ClientPortalCleanup() {
  return <NextJsPortalCleanup />;
}


