import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Total bookings
  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'CONFIRMED');

  // Upcoming bookings
  const { count: upcomingBookings } = await supabase
    .from('bookings')
    .select('*, classes!inner(start_time)', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'CONFIRMED')
    .gte('classes.start_time', new Date().toISOString());

  // Active membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*, plans(*)')
    .eq('user_id', user.id)
    .eq('status', 'ACTIVE')
    .gt('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    totalBookings: totalBookings ?? 0,
    upcomingBookings: upcomingBookings ?? 0,
    creditsRemaining: membership?.credits_remaining ?? 0,
    membershipEnd: membership?.end_date ?? null,
    planName: membership?.plans?.name ?? null,
  });
}