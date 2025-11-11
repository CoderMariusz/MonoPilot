'use client';

import { useState, useEffect } from 'react';
import { Ban, Loader2 } from 'lucide-react';
import type { Session } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from '@/lib/toast';

export function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('login_time', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (sessionId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke the session for ${userName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'Revoked' })
        .eq('id', sessionId);

      if (error) throw error;

      toast.success(`Session for ${userName} revoked successfully`);
      loadSessions(); // Refresh list
    } catch (error) {
      console.error('Error revoking session:', error);
      toast.error('Failed to revoke session');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
        <span className="ml-3 text-sm text-slate-600">Loading sessions...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No active sessions found
      </div>
    );
  }

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
                    onClick={() => handleRevoke(session.id, session.user_name)}
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
