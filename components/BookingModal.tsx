import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingModalProps {
  classData: {
    id: string;
    name: string;
    instructor: string;
    level: string;
    startTime: string;
    availableSpots: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  credits?: number;
}

const LEVEL_COLORS: Record<string, string> = {
  Principiante: 'bg-green-100 text-green-800',
  Intermedio: 'bg-yellow-100 text-yellow-800',
  Avanzado: 'bg-red-100 text-red-800',
};

export default function BookingModal({ classData, isOpen, onClose, onSuccess, credits }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: classData.id })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
          onSuccess();
        }, 2000);
      } else {
        setError(data.error || 'Error al reservar');
      }
    } catch (_err) {
      setError('Error al reservar');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <h2 className="text-xl font-bold text-casaCoffee mb-2">Confirmar Reservación</h2>
            <div className="mb-4">
              <div className="font-semibold text-casaCoffee">{classData.name}</div>
              <div className="text-casaCoffee/70 text-sm">Instructor: {classData.instructor}</div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${LEVEL_COLORS[classData.level]} mr-2`}>{classData.level}</span>
              <div className="text-casaCoffee/70 text-sm">{new Date(classData.startTime).toLocaleString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</div>
              <div className="mt-2 text-casaCoffee/80 text-sm">Espacios disponibles: {classData.availableSpots}</div>
              <div className="mt-2 text-casaOlive font-bold">Tus créditos: {credits ?? '-'}</div>
            </div>
            {success ? (
              <div className="text-green-600 font-semibold text-center py-4">¡Reserva exitosa!</div>
            ) : (
              <>
                {error && <div className="text-red-600 font-semibold text-center mb-2">{error}</div>}
                <div className="mb-4 text-center text-casaCoffee">¿Usar 1 crédito para reservar esta clase?</div>
                <div className="flex gap-4 justify-center">
                  <button
                    className="px-4 py-2 rounded bg-casaOlive text-white font-bold hover:bg-casaCoffee transition disabled:opacity-50"
                    onClick={handleConfirm}
                    disabled={loading || (credits !== undefined && credits < 1) || classData.availableSpots === 0}
                  >
                    {loading ? 'Reservando...' : 'Confirmar Reservación'}
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-casaBeige text-casaCoffee font-bold hover:bg-casaCream transition"
                    onClick={onClose}
                    disabled={loading}
                  >Cancelar</button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
