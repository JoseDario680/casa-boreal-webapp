import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  let query = supabase
    .from('classes')
    .select(`
      *,
      users!classes_instructor_id_fkey ( id, name ),
      bookings ( id, user_id, status )
    `)
    .eq('is_active', true)
    .order('start_time', { ascending: true });

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  if (from) query = query.gte('start_time', from);
  if (to) query = query.lte('start_time', to);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to include booked count
  const result = (data || []).map((c) => ({
    ...c,
    instructor: c.users,
    booked: (c.bookings || []).filter((b: { status: string }) => b.status === 'CONFIRMED').length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
  }

  const body = await req.json();
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: body.name,
      instructor_id: body.instructor_id || null,
      level: body.level || 'Todos los niveles',
      start_time: body.start_time,
      end_time: body.end_time,
      capacity: body.capacity || 15,
      recurrence: body.recurrence || 'NONE',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}