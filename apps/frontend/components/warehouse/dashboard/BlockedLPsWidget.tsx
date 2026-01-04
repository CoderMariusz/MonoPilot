/**
 * Blocked LPs Widget Component
 * Story: 05.7 - Warehouse Dashboard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import type { BlockedLPAlert } from '@/lib/types/warehouse-dashboard';
import Link from 'next/link';

interface BlockedLPsWidgetProps {
  alerts: BlockedLPAlert[];
  isLoading: boolean;
}

const statusColors = {
  quarantine: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

export function BlockedLPsWidget({ alerts, isLoading }: BlockedLPsWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Blocked LPs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Blocked LPs
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocked LPs</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <Link
                key={alert.lp_id}
                href={`/warehouse/license-plates/${alert.lp_number}`}
                className="block hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.lp_number}</p>
                    <p className="text-xs text-muted-foreground">{alert.product_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={statusColors[alert.qa_status]}>
                      {alert.qa_status}
                    </Badge>
                    {alert.block_reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.block_reason}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {alerts.length > 10 && (
              <Link
                href="/warehouse/license-plates?filter=blocked"
                className="text-sm text-primary hover:underline block mt-2"
              >
                View all {alerts.length} items →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
