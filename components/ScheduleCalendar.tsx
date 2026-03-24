import React, { useEffect, useState } from 'react';
import BookingModal from './BookingModal';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { ChevronLeft, ChevronRight, Clock, MapPin, Users as UsersIcon, Loader2, Calendar } from 'lucide-react';

/* ──── Level config ──── */
const LEVEL_STYLE: Record<string, { bg: string; dot: string; text: string }> = {
  Principiante: { bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700' },
  Intermedio: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
  Avanzado: { bg: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', text: 'text-rose-700' },
  'Todos los niveles': { bg: 'bg-sky-50 border-sky-200', dot: 'bg-sky-500', text: 'text-sky-700' },
};
const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function ScheduleCalendar() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const diff = Math.floor((today.getTime() - start.getTime()) / 86400000);
    return Math.min(Math.max(diff, 0), 6);
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [credits, setCredits] = useState(0);

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
      .then(data => { setClasses(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setClasses([]); setLoading(false); });
  };

  useEffect(() => { fetchClasses(); }, [weekStart]);

  const handleReserve = (cls: any) => { setSelectedClass(cls); setModalOpen(true); };
  const handleModalClose = () => { setModalOpen(false); setSelectedClass(null); };
  const handleSuccess = () => {
    fetchClasses();
    fetch('/api/user/membership')
      .then(res => res.json())
      .then(data => setCredits(data.active?.credits_remaining ?? 0))
      .catch(() => {});
  };

  const goWeek = (dir: number) => {
    setWeekStart(addDays(weekStart, dir * 7));
    setSelectedDayIdx(dir > 0 ? 0 : 6);
  };

  const filteredClasses = selectedLevel ? classes.filter(c => c.level === selectedLevel) : classes;
  const selectedDate = addDays(weekStart, selectedDayIdx);
  const dayClasses = filteredClasses
    .filter(cls => isSameDay(new Date(cls.start_time), selectedDate))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <>
      <div className="w-full max-w-3xl mx-auto">
        {/* ── Week navigation ── */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => goWeek(-1)} className="p-2.5 rounded-xl bg-white border border-casaBeige hover:bg-casaBeige/60 text-casaCoffee transition active:scale-95">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm text-casaCoffee/50 font-medium">Semana del</p>
            <p className="font-heading text-lg lg:text-xl text-casaCoffee capitalize">
              {format(weekStart, "d 'de' MMMM", { locale: es })} – {format(addDays(weekStart, 6), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
          <button onClick={() => goWeek(1)} className="p-2.5 rounded-xl bg-white border border-casaBeige hover:bg-casaBeige/60 text-casaCoffee transition active:scale-95">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ── Day selector strip ── */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {dayLabels.map((label, i) => {
            const date = addDays(weekStart, i);
            const today = isToday(date);
            const active = i === selectedDayIdx;
            const count = filteredClasses.filter(c => isSameDay(new Date(c.start_time), date)).length;
            return (
              <button key={i} onClick={() => setSelectedDayIdx(i)}
                className={`flex-1 min-w-[4.5rem] flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl border-2 transition-all duration-200
                  ${active
                    ? 'bg-casaCoffee text-white border-casaCoffee shadow-lg shadow-casaCoffee/20 scale-[1.03]'
                    : today
                      ? 'bg-casaOlive/10 text-casaCoffee border-casaOlive/30 hover:border-casaOlive/50'
                      : 'bg-white text-casaCoffee/70 border-casaBeige hover:border-casaCoffee/20 hover:bg-casaCream'
                  }`}>
                <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
                <span className={`text-xl font-bold leading-none ${active ? 'text-white' : ''}`}>{format(date, 'd')}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold mt-0.5 ${active ? 'text-white/80' : 'text-casaOlive'}`}>
                    {count} clase{count > 1 ? 's' : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Level filter ── */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['', 'Principiante', 'Intermedio', 'Avanzado', 'Todos los niveles'].map(lvl => (
            <button key={lvl} onClick={() => setSelectedLevel(lvl)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200
                ${selectedLevel === lvl
                  ? 'bg-casaCoffee text-white border-casaCoffee'
                  : 'bg-white text-casaCoffee/60 border-casaBeige hover:border-casaCoffee/30'}`}>
              {lvl || 'Todos'}
            </button>
          ))}
        </div>

        {/* ── Class list ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-casaCoffee/50">
            <Loader2 className="animate-spin mb-3" size={28} />
            <p className="text-sm">Cargando clases…</p>
          </div>
        ) : dayClasses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-casaBeige">
            <Calendar size={40} className="mx-auto mb-3 text-casaCoffee/20" />
            <p className="text-casaCoffee/50 font-medium">No hay clases programadas</p>
            <p className="text-casaCoffee/30 text-sm mt-1">
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayClasses.map(cls => {
              const availableSpots = cls.capacity - (cls.booked || 0);
              const level = LEVEL_STYLE[cls.level] || LEVEL_STYLE['Todos los niveles'];
              const full = availableSpots <= 0;
              return (
                <div key={cls.id}
                  className={`bg-white rounded-2xl border border-casaBeige p-5 hover:shadow-md transition-all duration-200 ${full ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: class info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-heading text-lg text-casaCoffee font-semibold">{cls.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${level.bg} ${level.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
                          {cls.level}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-sm text-casaCoffee/60">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} className="text-casaCoffee/40" />
                          {format(new Date(cls.start_time), 'HH:mm')} – {format(new Date(cls.end_time), 'HH:mm')}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={14} className="text-casaCoffee/40" />
                          {cls.instructor?.name || 'Sin instructor'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UsersIcon size={14} className="text-casaCoffee/40" />
                          {availableSpots}/{cls.capacity} lugares
                        </span>
                      </div>
                    </div>

                    {/* Right: reserve button */}
                    <div className="flex-shrink-0 pt-1">
                      <button
                        onClick={() => handleReserve({ ...cls, availableSpots })}
                        disabled={full}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95
                          ${full
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-casaOlive text-white hover:bg-casaOlive/90 shadow-sm hover:shadow-md'
                          }`}>
                        {full ? 'Llena' : 'Reservar'}
                      </button>
                    </div>
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
