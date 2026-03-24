import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[stats] auth error:', authError);
      return NextResponse.json({ error: 'Auth error', details: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Total bookings
    const { count: totalBookings, error: e1 } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'CONFIRMED');

    if (e1) {
      console.error('[stats] totalBookings error:', e1);
      return NextResponse.json({ error: e1.message, code: e1.code, details: e1.details, hint: e1.hint }, { status: 500 });
    }

    // Upcoming bookings
    const { count: upcomingBookings, error: e2 } = await supabase
      .from('bookings')
      .select('*, classes!inner(start_time)', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'CONFIRMED')
      .gte('classes.start_time', new Date().toISOString());

    if (e2) {
      console.error('[stats] upcomingBookings error:', e2);
      return NextResponse.json({ error: e2.message, code: e2.code, details: e2.details, hint: e2.hint }, { status: 500 });
    }

    // Active membership
    const { data: membership, error: e3 } = await supabase
      .from('memberships')
      .select('*, plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .gt('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (e3) {
      console.error('[stats] membership error:', e3);
      return NextResponse.json({ error: e3.message, code: e3.code, details: e3.details, hint: e3.hint }, { status: 500 });
    }

    return NextResponse.json({
      totalBookings: totalBookings ?? 0,
      upcomingBookings: upcomingBookings ?? 0,
      creditsRemaining: membership?.credits_remaining ?? 0,
      membershipEnd: membership?.end_date ?? null,
      planName: membership?.plans?.name ?? null,
    });
  } catch (err) {
    console.error('[stats] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}