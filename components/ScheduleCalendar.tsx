import React, { useEffect, useState } from 'react';
import BookingModal from './BookingModal';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale/es';

const LEVEL_COLORS: Record<string, string> = {
  Principiante: 'bg-green-100 text-green-800',
  Intermedio: 'bg-yellow-100 text-yellow-800',
  Avanzado: 'bg-red-100 text-red-800',
  'Todos los niveles': 'bg-blue-100 text-blue-800',
};

const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function ScheduleCalendar() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [credits, setCredits] = useState(0);

  // Fetch credits
  useEffect(() => {
    fetch('/api/user/membership')
      .then(res => res.json())
      .then(data => setCredits(data.active?.credits_remaining ?? 0))
      .catch(() => setCredits(0));
  }, []);

  const fetchClasses = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('from', weekStart.toISOString());
    params.append('to', addDays(weekStart, 6).toISOString());
    fetch(`/api/classes?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setClasses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setClasses([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClasses();
  }, [weekStart]);

  const handleReserve = (cls: any) => {
    setSelectedClass(cls);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedClass(null);
  };

  const handleSuccess = () => {
    fetchClasses();
    // Refresh credits
    fetch('/api/user/membership')
      .then(res => res.json())
      .then(data => setCredits(data.active?.credits_remaining ?? 0))
      .catch(() => {});
  };

  const filteredClasses = selectedLevel
    ? classes.filter(c => c.level === selectedLevel)
    : classes;

  return (
    <>
      <div className="w-full max-w-5xl mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex gap-2 items-center">
            <button className="px-3 py-1 rounded bg-casaOlive text-white" onClick={() => setWeekStart(addDays(weekStart, -7))}>Semana anterior</button>
            <span className="font-bold text-casaCoffee">{format(weekStart, 'd MMM', { locale: es })} - {format(addDays(weekStart, 6), 'd MMM', { locale: es })}</span>
            <button className="px-3 py-1 rounded bg-casaOlive text-white" onClick={() => setWeekStart(addDays(weekStart, 7))}>Semana siguiente</button>
          </div>
          <div className="flex gap-2">
            <select className="border rounded px-2 py-1" value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
              <option value="">Todos los niveles</option>
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10 text-casaCoffee/60">Cargando clases...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const dayDate = addDays(weekStart, index);
              const dayClasses = filteredClasses.filter(
                cls => isSameDay(new Date(cls.start_time), dayDate)
              );

              return (
                <div key={index} className="p-4 border rounded-lg bg-white shadow-md">
                  <h3 className="text-lg font-semibold mb-2">{day} ({dayClasses.length})</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {dayClasses.length > 0 ? (
                      dayClasses.map(cls => {
                        const availableSpots = cls.capacity - (cls.booked || 0);
                        return (
                          <div
                            key={cls.id}
                            className={`p-2 mb-2 rounded-lg ${LEVEL_COLORS[cls.level] || 'bg-gray-100 text-gray-800'}`}
                          >
                            <p className="text-sm font-medium">{cls.name}</p>
                            <p className="text-xs">{format(new Date(cls.start_time), 'HH:mm')}</p>
                            <p className="text-xs">{cls.instructor?.name || 'Sin instructor'}</p>
                            <p className="text-xs">{availableSpots} lugares</p>
                            <button
                              className="mt-1 text-xs text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
                              onClick={() => handleReserve({ ...cls, availableSpots })}
                              disabled={availableSpots <= 0}
                            >
                              {availableSpots > 0 ? 'Reservar' : 'Llena'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">Sin clases</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selectedClass && (
        <BookingModal
          classData={{
            id: selectedClass.id,
            name: selectedClass.name,
            instructor: selectedClass.instructor?.name || 'Sin instructor',
            level: selectedClass.level,
            startTime: selectedClass.start_time,
            availableSpots: selectedClass.availableSpots,
          }}
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
          credits={credits}
        />
      )}
    </>
  );
}
