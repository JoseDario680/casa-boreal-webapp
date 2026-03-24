import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics: Record<string, unknown> = {};

  // 1. Check env vars
  diagnostics.envVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
    supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
    supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
  };

  try {
    const supabase = await createClient();

    // 2. Test auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    diagnostics.auth = {
      user: user ? { id: user.id, email: user.email } : null,
      error: authError?.message || null,
    };

    // 3. Test plans table (public read via RLS)
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, name')
      .limit(5);
    diagnostics.plans = { data: plans, error: plansError?.message || null };

    // 4. Test classes table (public read via RLS)
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('id, name')
      .limit(5);
    diagnostics.classes = { data: classes, error: classesError?.message || null };

    // 5. Test users table (will be empty/blocked by RLS for anon)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);
    diagnostics.users = { data: users, error: usersError?.message || null };

    // 6. If user exists, test their specific queries
    if (user) {
      const { data: memberships, error: memError } = await supabase
        .from('memberships')
        .select('*, plans(*)')
        .eq('user_id', user.id);
      diagnostics.memberships = { data: memberships, error: memError ? { message: memError.message, code: memError.code, details: memError.details, hint: memError.hint } : null };

      const { data: bookings, error: bookError } = await supabase
        .from('bookings')
        .select(`*, classes(id, name, level, start_time, end_time, capacity, users!classes_instructor_id_fkey(id, name))`)
        .eq('user_id', user.id);
      diagnostics.bookings = { data: bookings, error: bookError ? { message: bookError.message, code: bookError.code, details: bookError.details, hint: bookError.hint } : null };
    }
  } catch (err) {
    diagnostics.unexpectedError = String(err);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
