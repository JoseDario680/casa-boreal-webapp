import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verify ownership
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, user_id, class_id, status')
    .eq('id', id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
  }

  if (booking.user_id !== user.id) {
    // Check if admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }
  }

  // Cancel instead of hard delete
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Restore credit if was confirmed
  if (booking.status === 'CONFIRMED') {
    const { data: membership } = await supabase
      .from('memberships')
      .select('id, credits_remaining')
      .eq('user_id', booking.user_id)
      .eq('status', 'ACTIVE')
      .gt('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (membership && membership.credits_remaining !== null) {
      await supabase
        .from('memberships')
        .update({ credits_remaining: membership.credits_remaining + 1 })
        .eq('id', membership.id);
    }
  }

  return NextResponse.json({ message: 'Reserva cancelada' });
}