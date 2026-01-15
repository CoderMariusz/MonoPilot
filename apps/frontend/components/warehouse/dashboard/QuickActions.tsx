/**
 * Quick Actions Component
 * Story: 05.7 - Warehouse Dashboard
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { CreateLPModal } from '@/components/warehouse/CreateLPModal';

interface QuickActionsProps {
  onLPCreated?: () => void;
}

export function QuickActions({ onLPCreated }: QuickActionsProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const handleLPCreated = () => {
    setCreateModalOpen(false);
    onLPCreated?.();
  };

  return (
    <>
      <div className="flex gap-3">
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create LP
        </Button>
        <Button variant="outline" asChild>
          <Link href="/warehouse/inventory">
            <Search className="h-4 w-4 mr-2" />
            View Inventory
          </Link>
        </Button>
      </div>

      <CreateLPModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleLPCreated}
      />
    </>
  );
}
