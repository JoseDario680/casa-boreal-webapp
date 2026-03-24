'use client';

import useSWR from 'swr';
import { useState } from 'react';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const contentType = res.headers.get('content-type');
  if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  throw new Error('Respuesta no es JSON');
};

export default function useBookings() {
  const { data, error, mutate } = useSWR('/api/bookings', fetcher);
  const [feedback, setFeedback] = useState('');
  const isLoading = !data && !error;
  const isError = Boolean(error);

  const cancelBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo cancelar la clase');
      await mutate();
      setFeedback('Clase cancelada exitosamente');
    } catch (err) {
      console.error(err);
      setFeedback('Error al cancelar la clase');
    } finally {
      setTimeout(() => setFeedback(''), 2500);
    }
  };

  return { bookings: data ?? [], isError, isLoading, error, cancelBooking, feedback };
}
