'use client';

import { useState, useEffect } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';

interface Membership {
  id: string;
  status: string;
  credits_remaining: number;
  end_date: string | null;
  plan_id: string | null;
  user_id: string;
  users?: { email: string; name: string | null };
  plans?: { name: string } | null;
}

export default function MembershipsAdminPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editFeedback, setEditFeedback] = useState<string>('');

  useEffect(() => {
    refreshMemberships();
  }, []);

  const handleEdit = (membership: Membership) => {
    setEditId(membership.id);
    setEditCredits(membership.credits_remaining ?? 0);
    setEditStatus(membership.status);
  };

  const saveEdit = async () => {
    if (editId) {
      const res = await fetch(`/api/admin/memberships/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits_remaining: editCredits, status: editStatus }),
      });
      if (res.ok) {
        setEditFeedback('¡Membresía actualizada!');
        setTimeout(() => setEditFeedback(''), 2000);
        setEditId(null);
        refreshMemberships();
      } else {
        setEditFeedback('Error al actualizar membresía');
      }
    }
  };

  const refreshMemberships = async () => {
    const res = await fetch('/api/admin/memberships');
    if (res.ok) setMemberships(await res.json());
  };

  const isActive = (m: Membership) => m.status === 'ACTIVE';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-4 space-x-2">
        <CreditCardIcon className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Administrar Membresías</h1>
      </div>
      <ul className="space-y-2">
        {memberships.map((membership) => (
          <li key={membership.id} className="border rounded p-2 flex flex-col md:flex-row justify-between items-center">
            <div className="flex-1">
              <div><span className="font-bold">Plan:</span> {membership.plans?.name ?? 'Sin plan'}</div>
              <div><span className="font-bold">Email:</span> {membership.users?.email ?? '-'}</div>
              <div><span className="font-bold">Créditos:</span> {membership.credits_remaining ?? '-'}</div>
              <div><span className="font-bold">Fin:</span> {membership.end_date ? new Date(membership.end_date).toLocaleDateString() : '-'}</div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={isActive(membership) ? "px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded" : "px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded"}>
                {isActive(membership) ? 'Activa' : membership.status}
              </span>
              <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={() => handleEdit(membership)}>Editar</button>
            </div>
          </li>
        ))}
      </ul>
      {editId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Editar Membresía</h3>
            <div className="mb-2">
              <label className="block mb-1">Créditos</label>
              <input type="number" className="border rounded px-2 py-1 w-full" value={editCredits} onChange={e => setEditCredits(Number(e.target.value))} />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Estado</label>
              <select className="border rounded px-2 py-1 w-full" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                <option value="ACTIVE">Activa</option>
                <option value="EXPIRED">Expirada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
            {editFeedback && <div className="mb-2 text-green-600">{editFeedback}</div>}
            <div className="flex justify-end space-x-2">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setEditId(null)}>Cancelar</button>
              <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={saveEdit}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
