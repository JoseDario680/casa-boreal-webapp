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

  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .order('price_cents', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const admin = await requireAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const body = await req.json();

  const { data, error } = await supabase
    .from('plans')
    .insert({
      name: body.name,
      description: body.description || null,
      price_cents: body.price_cents ?? Math.round((body.price || 0) * 100),
      classes_per_month: body.classes_per_month ?? body.credits ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
