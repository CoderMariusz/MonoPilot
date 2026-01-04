/**
 * LP Status Management Page
 * Story: 05.4 - LP Status Management
 * Page for managing LP status and QA status with audit trail
 *
 * States:
 * - Loading: Fetching LP data
 * - Success: Display status management interface
 * - Error: LP not found or access denied
 * - Empty: No audit history
 *
 * Per wireframe WH-004.
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, History, Shield, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LPStatusBadge,
  LPQAStatusBadge,
  ChangeLPStatusModal,
  ChangeQAStatusModal,
  BlockLPModal,
  UnblockLPModal,
  LPStatusAuditTrail,
} from '@/components/warehouse';
import type { LicensePlate } from '@/lib/types/license-plate';

// ============================================================================
// MOCK DATA (TODO: Replace with API call)
// ============================================================================

function getMockLP(id: string): LicensePlate {
  return {
    id,
    lp_number: 'LP-2024-00001234',
    product_id: 'prod-1',
    product: {
      id: 'prod-1',
      code: 'RM-FLOUR-001',
      name: 'Flour Type A',
      type: 'raw_material',
    },
    batch_number: 'BATCH-2024-456',
    quantity: 500,
    uom: 'kg',
    status: 'available',
    qa_status: 'passed',
    location_id: 'loc-1',
    location: {
      id: 'loc-1',
      name: 'A-01-R03-B05',
      code: 'A-01-R03-B05',
      warehouse_id: 'wh-1',
      warehouse_name: 'Main Warehouse',
    },
    org_id: 'org-1',
    created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Separator />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  const router = useRouter();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <Alert variant="destructive" className="max-w-2xl">
        <AlertTitle>Error Loading License Plate</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
      <Button onClick={() => router.push('/warehouse/license-plates')} variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to License Plates
      </Button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function LPStatusManagementPage() {
  const params = useParams();
  const router = useRouter();
  const lpId = params.id as string;

  const [lp, setLp] = useState<LicensePlate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState(false);
  const [isChangeQAStatusModalOpen, setIsChangeQAStatusModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);

  // Fetch LP data
  useEffect(() => {
    async function fetchLP() {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/warehouse/license-plates/${lpId}`);
        // if (!response.ok) throw new Error('License plate not found');
        // const data = await response.json();
        // setLp(data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setLp(getMockLP(lpId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load license plate');
      } finally {
        setIsLoading(false);
      }
    }

    if (lpId) {
      fetchLP();
    }
  }, [lpId]);

  // Refetch LP after status change
  const handleRefresh = async () => {
    if (!lpId) return;

    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/warehouse/license-plates/${lpId}`);
      // const data = await response.json();
      // setLp(data);

      // Simulate refresh
      await new Promise((resolve) => setTimeout(resolve, 500));
      setLp(getMockLP(lpId));
    } catch (err) {
      console.error('Failed to refresh LP:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        <LoadingState />
      </div>
    );
  }

  // Error state
  if (error || !lp) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <ErrorState error={error || 'License plate not found'} />
      </div>
    );
  }

  const canChangeStatus = lp.status !== 'consumed'; // Terminal state check
  const isBlocked = lp.status === 'blocked';

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/warehouse/license-plates')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Status Management</h1>
              <p className="text-sm text-gray-500">
                Manage status and QA status for {lp.lp_number}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* LP Info Summary */}
      <Card>
        <CardHeader>
          <CardTitle>License Plate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <span className="text-sm text-gray-500">LP Number</span>
              <p className="text-lg font-semibold">{lp.lp_number}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Product</span>
              <p className="text-lg font-semibold">
                {lp.product?.name}
                <span className="ml-2 text-sm text-gray-500">({lp.product?.code})</span>
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Quantity</span>
              <p className="text-lg font-semibold">
                {lp.quantity} {lp.uom}
              </p>
            </div>
            {lp.batch_number && (
              <div>
                <span className="text-sm text-gray-500">Batch</span>
                <p className="text-lg font-semibold">{lp.batch_number}</p>
              </div>
            )}
            {lp.location && (
              <div>
                <span className="text-sm text-gray-500">Location</span>
                <p className="text-lg font-semibold">{lp.location.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Management Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LP Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              LP Status
            </CardTitle>
            <CardDescription>Manage license plate availability status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Current Status</span>
              <div className="mt-2">
                <LPStatusBadge status={lp.status} size="lg" />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button
                onClick={() => setIsChangeStatusModalOpen(true)}
                disabled={!canChangeStatus}
                className="w-full"
              >
                Change Status
              </Button>

              {isBlocked ? (
                <Button
                  onClick={() => setIsUnblockModalOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unblock LP
                </Button>
              ) : canChangeStatus ? (
                <Button
                  onClick={() => setIsBlockModalOpen(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Block LP
                </Button>
              ) : null}

              {!canChangeStatus && (
                <p className="text-xs text-amber-600">
                  ⚠️ Status cannot be changed (Consumed is a terminal state)
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QA Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              QA Status
            </CardTitle>
            <CardDescription>Manage quality assurance status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">Current QA Status</span>
              <div className="mt-2">
                <LPQAStatusBadge qaStatus={lp.qa_status} size="lg" />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button onClick={() => setIsChangeQAStatusModalOpen(true)} className="w-full">
                Change QA Status
              </Button>

              <p className="text-xs text-gray-500">
                ℹ️ Changing QA status may automatically update LP status
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Status Change History</CardTitle>
          <CardDescription>Complete audit trail of all status changes</CardDescription>
        </CardHeader>
        <CardContent>
          <LPStatusAuditTrail lpId={lp.id} />
        </CardContent>
      </Card>

      {/* Modals */}
      <ChangeLPStatusModal
        lp={lp}
        open={isChangeStatusModalOpen}
        onOpenChange={setIsChangeStatusModalOpen}
        onSuccess={handleRefresh}
      />

      <ChangeQAStatusModal
        lp={lp}
        open={isChangeQAStatusModalOpen}
        onOpenChange={setIsChangeQAStatusModalOpen}
        onSuccess={handleRefresh}
      />

      <BlockLPModal
        lp={lp}
        open={isBlockModalOpen}
        onOpenChange={setIsBlockModalOpen}
        onSuccess={handleRefresh}
      />

      <UnblockLPModal
        lp={lp}
        open={isUnblockModalOpen}
        onOpenChange={setIsUnblockModalOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
