import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'ADMIN') return null;
  return user;
}

export async function GET() {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const { data, error } = await supabase
    .from('memberships')
    .select('*, users(id, email, name), plans(id, name, price_cents, classes_per_month)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const body = await req.json();

  // Look up user by email if provided
  let userId = body.user_id;
  if (!userId && body.userEmail) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.userEmail)
      .single();
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    userId = user.id;
  }

  if (!userId || !body.plan_id) {
    return NextResponse.json({ error: 'user_id/userEmail y plan_id son requeridos' }, { status: 400 });
  }

  const startDate = body.start_date || new Date().toISOString().split('T')[0];
  const endDate = body.end_date;
  if (!endDate) {
    return NextResponse.json({ error: 'end_date es requerido' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('memberships')
    .insert({
      user_id: userId,
      plan_id: body.plan_id,
      credits_remaining: body.credits_remaining ?? null,
      start_date: startDate,
      end_date: endDate,
      status: body.status || 'ACTIVE',
    })
    .select('*, users(id, email, name), plans(id, name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
