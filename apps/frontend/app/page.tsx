import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createServerSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // If not authenticated, redirect to login
  redirect('/login')
}
