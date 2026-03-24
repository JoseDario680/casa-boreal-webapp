import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[membership] auth error:', authError);
      return NextResponse.json({ error: 'Auth error', details: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('*, plans(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[membership] query error:', error);
      return NextResponse.json({ error: error.message, code: error.code, details: error.details, hint: error.hint }, { status: 500 });
    }

    // Separate active and past
    const now = new Date().toISOString();
    const active = data?.find((m) => m.status === 'ACTIVE' && m.end_date > now) ?? null;
    const history = data?.filter((m) => m !== active) ?? [];

    return NextResponse.json({ active, history });
  } catch (err) {
    console.error('[membership] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}