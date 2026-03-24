import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface MembershipData {
  active: {
    id: string;
    status: string;
    credits_remaining: number;
    end_date: string | null;
    plans?: { name: string; price_cents: number } | null;
  } | null;
  history: Array<{
    id: string;
    status: string;
    credits_remaining: number;
    end_date: string | null;
    plans?: { name: string; price_cents: number } | null;
  }>;
}

const MembershipSection = () => {
  const [data, setData] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      try {
        const response = await fetch('/api/user/membership');
        if (!response.ok) throw new Error('Error al cargar detalles de membresía');
        const result = await response.json();
        setData(result);
      } catch (error: unknown) {
        if (error instanceof Error) toast.error(error.message);
        else toast.error('Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchMembership();
  }, []);

  if (loading) return <div className="bg-white rounded-2xl shadow-sm p-6"><p className="text-gray-500">Cargando membresía...</p></div>;

  const active = data?.active;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Membresía</h2>
      <div className="mb-6">
        {active ? (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium">Plan: {active.plans?.name ?? 'Sin plan'}</p>
            <p className="text-sm">Créditos restantes: {active.credits_remaining}</p>
            <p className="text-sm">Fecha de vencimiento: {active.end_date ? new Date(active.end_date).toLocaleDateString() : '-'}</p>
            <p className="text-sm">Estado: <span className="font-medium text-green-600">Activa</span></p>
          </div>
        ) : (
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-500">No tienes una membresía activa.</p>
          </div>
        )}
      </div>
      {data?.history && data.history.length > 0 && (
        <>
          <h3 className="text-lg font-semibold mb-4">Historial</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="border-b p-2 text-left">Plan</th>
                <th className="border-b p-2 text-left">Créditos</th>
                <th className="border-b p-2 text-left">Fin</th>
                <th className="border-b p-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((m) => (
                <tr key={m.id}>
                  <td className="border-b p-2">{m.plans?.name ?? '-'}</td>
                  <td className="border-b p-2">{m.credits_remaining}</td>
                  <td className="border-b p-2">{m.end_date ? new Date(m.end_date).toLocaleDateString() : '-'}</td>
                  <td className="border-b p-2">{m.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default MembershipSection;