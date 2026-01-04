/**
 * Quick Actions Component
 * Story: 05.7 - Warehouse Dashboard
 */

'use client';

import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="flex gap-3">
      <Button asChild>
        <Link href="/warehouse/license-plates/new">
          <Plus className="h-4 w-4 mr-2" />
          Create LP
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/warehouse/inventory">
          <Search className="h-4 w-4 mr-2" />
          View Inventory
        </Link>
      </Button>
    </div>
  );
}
