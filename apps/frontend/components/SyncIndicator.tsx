'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { offlineQueue, QueueStatus } from '@/lib/scanner/offlineQueue';

export function SyncIndicator() {
  const [status, setStatus] = useState<QueueStatus>({
    isOnline: true,
    queueLength: 0,
    lastSyncTime: Date.now()
  });

  useEffect(() => {
    // Subscribe to queue status changes
    const unsubscribe = offlineQueue.subscribe(setStatus);
    
    // Get initial status
    offlineQueue.getStatus().then(setStatus);

    return unsubscribe;
  }, []);

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-600" />;
    }
    
    if (status.queueLength > 0) {
      return <Clock className="w-4 h-4 text-amber-600" />;
    }
    
    return <Wifi className="w-4 h-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.queueLength > 0) {
      return `${status.queueLength} pending`;
    }
    
    return 'Synced';
  };

  const getStatusColor = () => {
    if (!status.isOnline) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    if (status.queueLength > 0) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const formatLastSync = () => {
    const diff = Date.now() - status.lastSyncTime;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return `${seconds}s ago`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium">
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {status.isOnline && status.queueLength === 0 && (
        <span className="text-xs text-slate-500">
          ({formatLastSync()})
        </span>
      )}
    </div>
  );
}
