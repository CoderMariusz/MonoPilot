'use client';

import { Ban } from 'lucide-react';
import { useSessions, revokeSession } from '@/lib/clientState';
import { toast } from '@/lib/toast';

export function SessionsTable() {
  const sessions = useSessions();

  const handleRevoke = (sessionId: number, userName: string) => {
    if (confirm(`Are you sure you want to revoke the session for ${userName}?`)) {
      revokeSession(sessionId);
      toast.success(`Session for ${userName} revoked successfully`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">User</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">IP Address</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Location</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Device</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Login Time</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-4 text-sm text-slate-900">{session.user_name}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{session.ip_address}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{session.location}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{session.device}</td>
              <td className="py-3 px-4 text-sm text-slate-600">{formatDate(session.login_time)}</td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusBadgeColor(session.status)}`}>
                  {session.status}
                </span>
              </td>
              <td className="py-3 px-4">
                {session.status === 'Active' && (
                  <button
                    onClick={() => handleRevoke(parseInt(session.id), session.user_name)}
                    className="text-slate-600 hover:text-red-600 transition-colors flex items-center gap-1"
                  >
                    <Ban className="w-4 h-4" />
                    <span className="text-xs">Revoke</span>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
