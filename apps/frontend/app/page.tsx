'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { getRoleBasedRoute } from '@/lib/auth/roleRedirect';
import { shouldUseMockData } from '@/lib/api/config';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // LOG AUTH STATE ON ROOT PAGE
  useEffect(() => {
    console.log('=== ROOT PAGE - Auth State ===');
    console.log('Loading:', loading);
    console.log('Has User:', !!user);
    console.log('Has Profile:', !!profile);
    console.log('Profile Role:', profile?.role);
    console.log('Using Mock Data:', shouldUseMockData());
    console.log('==============================');
  }, [user, profile, loading]);

  // Show loading while checking authentication
  if (!shouldUseMockData() && loading) {
    

    return (
      <div className="flex items-center justify-center h-full min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="flex items-center">
          <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
          <span className="ml-2 text-slate-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show dashboard for authenticated users or mock mode
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Dashboard</h1>
      <p className="text-base text-slate-600">Welcome to Forza Manufacturing Execution System</p>
      {!shouldUseMockData() && profile && (
        <div className="mt-4">
          <p className="text-slate-700">Logged in as: <strong>{profile.name}</strong></p>
          <p className="text-slate-600">Role: <strong>{profile.role}</strong></p>
        </div>
      )}
      {!shouldUseMockData() && !profile && !loading && (
        <div className="mt-4">
          <p className="text-slate-600">Not logged in. <Link href="/login" className="text-slate-900 font-medium">Go to login</Link></p>
        </div>
      )}
    </div>
  );
}
