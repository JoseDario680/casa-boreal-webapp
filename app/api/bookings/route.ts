import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      classes (
        id, name, level, start_time, end_time, capacity,
        users!classes_instructor_id_fkey ( id, name )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { classId } = await req.json();
  if (!classId) {
    return NextResponse.json({ error: 'classId es requerido' }, { status: 400 });
  }

  // Check if user already has this booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .eq('status', 'CONFIRMED')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 409 });
  }

  // Check class capacity
  const { data: cls } = await supabase
    .from('classes')
    .select('capacity')
    .eq('id', classId)
    .single();

  if (!cls) {
    return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 });
  }

  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('status', 'CONFIRMED');

  const status = (count ?? 0) >= cls.capacity ? 'WAITLIST' : 'CONFIRMED';

  // Deduct credit if user has active membership
  if (status === 'CONFIRMED') {
    const { data: membership } = await supabase
      .from('memberships')
      .select('id, credits_remaining')
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .gt('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membership && membership.credits_remaining !== null) {
      if (membership.credits_remaining <= 0) {
        return NextResponse.json({ error: 'No tienes créditos disponibles' }, { status: 403 });
      }
      await supabase
        .from('memberships')
        .update({ credits_remaining: membership.credits_remaining - 1 })
        .eq('id', membership.id);
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({ user_id: user.id, class_id: classId, status })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}