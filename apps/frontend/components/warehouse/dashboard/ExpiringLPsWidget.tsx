/**
 * Expiring LPs Widget Component
 * Story: 05.7 - Warehouse Dashboard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import type { ExpiringItemAlert } from '@/lib/types/warehouse-dashboard';
import Link from 'next/link';
import { format } from 'date-fns';

interface ExpiringLPsWidgetProps {
  alerts: ExpiringItemAlert[];
  isLoading: boolean;
}

function getUrgencyColor(daysUntilExpiry: number): string {
  if (daysUntilExpiry < 7) return 'text-red-600 bg-red-50';
  if (daysUntilExpiry < 14) return 'text-orange-600 bg-orange-50';
  return 'text-yellow-600 bg-yellow-50';
}

export function ExpiringLPsWidget({ alerts, isLoading }: ExpiringLPsWidgetProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Expiring Items
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
          <Clock className="h-5 w-5 text-yellow-500" />
          Expiring Items
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items expiring soon</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert) => (
              <Link
                key={alert.lp_id}
                href={`/warehouse/license-plates/${alert.lp_number}`}
                className="block hover:bg-muted/50 p-2 rounded-md transition-colors"
                data-testid="expiring-item"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.lp_number}</p>
                    <p className="text-xs text-muted-foreground">{alert.product_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={getUrgencyColor(alert.days_until_expiry)}
                    >
                      {alert.days_until_expiry} days
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(alert.expiry_date), 'MMM dd')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {alerts.length > 10 && (
              <Link
                href="/warehouse/license-plates?filter=expiring"
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
