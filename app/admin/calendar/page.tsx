'use client';

import React, { useState, useEffect } from 'react';

interface ClassEvent {
  id: string;
  name: string;
  instructor: { id: string; name: string } | null;
  level: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
}

const fetchClasses = async (): Promise<ClassEvent[]> => {
  const res = await fetch('/api/classes');
  if (!res.ok) return [];
  return res.json();
};

const CalendarManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassEvent[]>([]);
  useEffect(() => {
    fetchClasses().then(setClasses);
  }, []);
  const [newClass, setNewClass] = useState({
    name: '',
    instructor_id: '',
    level: 'Principiante',
    start_time: '',
    end_time: '',
    capacity: 20,
  });

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta clase? Se cancelarán todas las reservas existentes.')) return;
    const res = await fetch(`/api/classes/${classId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchClasses().then(setClasses);
    } else {
      alert('Error al eliminar la clase. Inténtalo de nuevo.');
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name || !newClass.start_time || !newClass.end_time) return;
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newClass.name,
        instructor_id: newClass.instructor_id || null,
        level: newClass.level,
        start_time: newClass.start_time,
        end_time: newClass.end_time,
        capacity: newClass.capacity,
      }),
    });
    if (res.ok) {
      fetchClasses().then(setClasses);
      setNewClass({ name: '', instructor_id: '', level: 'Principiante', start_time: '', end_time: '', capacity: 20 });
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestión de Calendario y Clases</h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Agregar Nueva Clase</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Clase</label>
            <input type="text" placeholder="Ej: Barre Básico" value={newClass.name} onChange={e => setNewClass({ ...newClass, name: e.target.value })} className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
            <select value={newClass.level} onChange={e => setNewClass({ ...newClass, level: e.target.value })} className="border rounded px-3 py-2 w-full">
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
              <option value="Todos los niveles">Todos los niveles</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Máxima</label>
            <input type="number" value={newClass.capacity} onChange={e => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 20 })} className="border rounded px-3 py-2 w-full" min="1" max="50" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Inicio</label>
            <input type="datetime-local" value={newClass.start_time} onChange={e => setNewClass({ ...newClass, start_time: e.target.value })} className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Fin</label>
            <input type="datetime-local" value={newClass.end_time} onChange={e => setNewClass({ ...newClass, end_time: e.target.value })} className="border rounded px-3 py-2 w-full" />
          </div>
        </div>
        <button onClick={handleAddClass} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400" disabled={!newClass.name || !newClass.start_time || !newClass.end_time}>
          Agregar Clase
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Clases Programadas</h2>
        {classes.length === 0 ? (
          <div className="text-center py-8 text-gray-500"><p>No hay clases programadas aún.</p></div>
        ) : (
          <ul className="space-y-2">
            {classes.map(cls => (
              <li key={cls.id} className="border rounded p-4 flex flex-col md:flex-row justify-between items-start md:items-center bg-white shadow-sm">
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-800 mb-2">{cls.name}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div><strong>Instructor:</strong> {cls.instructor?.name || 'Sin asignar'}</div>
                    <div><strong>Nivel:</strong>
                      <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                        cls.level === 'Principiante' ? 'bg-green-100 text-green-800' :
                        cls.level === 'Intermedio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{cls.level}</span>
                    </div>
                    <div><strong>Capacidad:</strong> {cls.capacity} ({cls.booked || 0} reservados)</div>
                    <div><strong>Horario:</strong> {new Date(cls.start_time).toLocaleDateString()} {new Date(cls.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(cls.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-4">
                  <button onClick={() => handleDeleteClass(cls.id)} className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 transition-colors">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CalendarManager;
