/**
 * Low Stock Alerts Component
 * Story: 05.7 - Warehouse Dashboard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import type { LowStockAlert } from '@/lib/types/warehouse-dashboard';
import Link from 'next/link';

interface LowStockAlertsProps {
  alerts: LowStockAlert[];
  isLoading: boolean;
}

export function LowStockAlerts({ alerts, isLoading }: LowStockAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-start">
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
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Low Stock Alerts
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No low stock alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <Link
                key={alert.product_id}
                href={`/warehouse/inventory?product=${alert.product_id}`}
                className="block hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm">{alert.product_name}</p>
                    <p className="text-xs text-muted-foreground">{alert.product_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">
                      {alert.current_count} / {alert.min_stock}
                    </p>
                    <p className="text-xs text-muted-foreground">Current / Min</p>
                  </div>
                </div>
              </Link>
            ))}
            {alerts.length > 10 && (
              <Link
                href="/warehouse/inventory?filter=low_stock"
                className="text-sm text-primary hover:underline block mt-2"
              >
                View all {alerts.length} alerts →
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
