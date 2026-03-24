import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (profile?.role !== 'ADMIN') return null;
  return user;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.credits_remaining !== undefined) updates.credits_remaining = body.credits_remaining;
  if (body.status !== undefined) updates.status = body.status;
  if (body.end_date !== undefined) updates.end_date = body.end_date;
  if (body.plan_id !== undefined) updates.plan_id = body.plan_id;

  const { data, error } = await supabase
    .from('memberships')
    .update(updates)
    .eq('id', id)
    .select('*, users(id, email, name), plans(id, name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
