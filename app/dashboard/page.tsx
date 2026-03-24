'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import StatsGrid from './components/StatsGrid';
import UpComingBookings from './components/UpComingBookings';
import MembershipCard from './components/MembershipCard';
import useBookings from './hooks/useBookings';
import useMembership from './hooks/useMembership';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { bookings, isError: bookingsError, isLoading: bookingsLoading, cancelBooking } = useBookings();
  const { membership, isError: membershipError, isLoading: membershipLoading } = useMembership();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        router.push('/login');
      } else {
        setUser(u);
      }
      setAuthLoading(false);
    });
  }, [router]);

  if (authLoading || bookingsLoading || membershipLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-casaCream">
        <Loader2 className="animate-spin text-casaCoffee w-8 h-8" />
      </div>
    );
  }

  if (bookingsError || membershipError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-casaCream">
        <p className="text-red-500">Hubo un error al cargar tu dashboard. Por favor, intenta nuevamente.</p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario';

  return (
    <main className="min-h-screen bg-casaCream px-6 py-10">
      <section className="max-w-6xl mx-auto space-y-10">
        <header>
          <h1 className="text-3xl font-heading text-casaCoffee">
            ¡Hola, {displayName.split(' ')[0]}! 👋
          </h1>
          <p className="text-casaCoffee/70">Aquí está tu resumen de Casa Boreal</p>
        </header>

        <StatsGrid membership={membership} />

        <MembershipCard membership={membership} />

        <UpComingBookings bookings={bookings} onCancel={cancelBooking} />
      </section>
    </main>
  );
}
