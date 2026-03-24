'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import ScheduleCalendar from '../../components/ScheduleCalendar';
import BookingModal from '../../components/BookingModal';

export default function SchedulePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setAuthChecked(true);
        // Fetch credits
        fetch('/api/user/membership')
          .then(res => res.json())
          .then(data => {
            setCredits(data.active?.credits_remaining ?? 0);
          })
          .catch(() => setCredits(0));
      }
    });
  }, [router]);

  if (!authChecked) return null;

  const _handleReserve = (cls: any) => {
    setSelectedClass(cls);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedClass(null);
  };

  const handleSuccess = () => {
    setCalendarKey(prev => prev + 1);
    // Refresh credits
    fetch('/api/user/membership')
      .then(res => res.json())
      .then(data => setCredits(data.active?.credits_remaining ?? 0))
      .catch(() => {});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-casaBeige via-casaCream to-casaBeige">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-casaCoffee/10 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold text-casaCoffee truncate">Reserva tu Clase</h1>
            <p className="text-casaOlive font-bold text-sm">{credits} créditos disponibles</p>
          </div>
          <Link href="/dashboard" className="flex-shrink-0 px-3 sm:px-4 py-2 bg-casaCoffee text-white text-sm rounded-xl hover:bg-casaCoffee/90 transition-all font-medium">
            ← Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ScheduleCalendar key={calendarKey} />
        <BookingModal
          classData={selectedClass}
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          credits={credits}
        />
      </main>
    </div>
  );
}
