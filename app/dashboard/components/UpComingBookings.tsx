'use client';
import { CalendarX } from 'lucide-react';

export default function UpcomingBookings({
  bookings,
  onCancel,
}: {
  bookings: any[];
  onCancel: (id: string) => void;
}) {
  // Filter to only upcoming confirmed bookings
  const upcoming = bookings?.filter(
    (b) =>
      b.status === 'CONFIRMED' &&
      b.classes &&
      new Date(b.classes.start_time) > new Date()
  ) ?? [];

  if (!upcoming.length)
    return (
      <div className="bg-white rounded-2xl p-6 border border-casaCoffee/10 text-casaCoffee/70">
        <p>No tienes clases próximas. ¡Reserva una para empezar! 💪</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-heading text-casaCoffee">Tus próximas clases</h2>
      {upcoming.map((booking) => (
        <div
          key={booking.id}
          className="bg-white border border-casaCoffee/10 p-5 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all"
        >
          <div>
            <h3 className="font-semibold text-casaCoffee">{booking.classes?.name}</h3>
            <p className="text-sm text-casaCoffee/70">
              {booking.classes?.users?.name ?? 'Instructor'} · {new Date(booking.classes?.start_time).toLocaleString('es-MX')}
            </p>
          </div>
          <button
            onClick={() => onCancel(booking.id)}
            className="flex items-center gap-2 bg-red-100 text-red-600 px-4 py-2 rounded-xl hover:bg-red-200 transition"
          >
            <CalendarX className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      ))}
    </div>
  );
}
