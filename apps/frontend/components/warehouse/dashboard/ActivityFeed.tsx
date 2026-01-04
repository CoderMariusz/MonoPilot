/**
 * Activity Feed Component
 * Story: 05.7 - Warehouse Dashboard
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ArrowDown, Split, Merge, Truck } from 'lucide-react';
import type { ActivityItem } from '@/lib/types/warehouse-dashboard';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

const operationIcons = {
  create: { icon: Plus, color: 'text-green-600', bg: 'bg-green-50' },
  consume: { icon: ArrowDown, color: 'text-blue-600', bg: 'bg-blue-50' },
  split: { icon: Split, color: 'text-orange-600', bg: 'bg-orange-50' },
  merge: { icon: Merge, color: 'text-purple-600', bg: 'bg-purple-50' },
  move: { icon: Truck, color: 'text-gray-600', bg: 'bg-gray-50' },
} as const;

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
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
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8" data-testid="activity-feed">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]" data-testid="activity-feed">
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const config = operationIcons[activity.operation_type];
                const Icon = config.icon;

                return (
                  <Link
                    key={`${activity.lp_id}-${index}`}
                    href={`/warehouse/license-plates/${activity.lp_number}`}
                    className="flex gap-3 hover:bg-muted/50 p-2 rounded-md transition-colors"
                  >
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full ${config.bg} flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.lp_number} - {activity.operation_type}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {activity.description}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.timestamp), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {activity.user_name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
