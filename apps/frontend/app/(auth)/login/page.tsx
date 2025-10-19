'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { toast } from '@/lib/toast';
import { getRoleBasedRoute } from '@/lib/auth/roleRedirect';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, profile, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  // LOG AUTH STATE CHANGES
  useEffect(() => {
    console.log('=== LOGIN PAGE - Auth State Changed ===');
    console.log('Auth Loading:', authLoading);
    console.log('Has User:', !!user);
    console.log('Has Profile:', !!profile);
    console.log('User Email:', user?.email);
    console.log('Profile Name:', profile?.name);
    console.log('Profile Role:', profile?.role);
    console.log('Current Path:', typeof window !== 'undefined' ? window.location.pathname : 'unknown');
    console.log('======================================');

    // Enable redirect after login
    if (!authLoading && user && profile) {
      const redirectPath = returnTo || '/';
      console.log('>>> REDIRECT: User is authenticated, redirecting to', redirectPath);
      router.push(redirectPath);
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    setLoading(true);

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('=====================');

    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        console.log('=== LOGIN ERROR ===');
        console.log('Error:', error);
        console.log('===================');

        // Provide more specific error messages
        let errorMessage = 'Failed to sign in';
        
        if (error.message?.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message?.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message?.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        setLoading(false); // Important: Reset loading on error
        return;
      }

      console.log('=== LOGIN SUCCESS ===');
      console.log('User object:', user);
      console.log('=====================');

      toast.success('Signed in successfully');
      
      // REDIRECT CODE - Uncomment below to enable redirect after successful login
      /*
      console.log('>>> REDIRECT: Navigating to /');
      window.location.href = '/';
      */

      // For now, just reset loading so you can see the state
      setLoading(false);
    } catch (error) {
      console.error('=== UNEXPECTED LOGIN ERROR ===');
      console.error('Error:', error);
      console.error('==============================');
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false); // Important: Reset loading on error
    }
    // Don't use finally block - it will set loading to false too early
  };

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [loading, user, router ]);



  // Show loading if checking authentication
  if (authLoading) {
    return (
      <div className="bg-white py-8 px-6 shadow rounded-lg">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
          <span className="ml-2 text-slate-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-8 px-6 shadow rounded-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
        <h2 className="mt-2 text-xl text-slate-600">Sign in to your account</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 pr-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500"
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-slate-400" />
              ) : (
                <Eye className="h-5 w-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-slate-900 hover:text-slate-700">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
