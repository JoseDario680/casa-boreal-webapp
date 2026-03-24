import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('memberships')
    .select('*, plans(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Separate active and past
  const now = new Date().toISOString();
  const active = data?.find((m) => m.status === 'ACTIVE' && m.end_date > now) ?? null;
  const history = data?.filter((m) => m !== active) ?? [];

  return NextResponse.json({ active, history });
}