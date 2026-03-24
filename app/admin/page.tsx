'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UsersIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  is_active: boolean;
  created_at?: string;
}

interface Membership {
  id: string;
  plan_id: string;
  user_id: string;
  status: string;
  credits_remaining?: number | null;
  end_date?: string;
  users?: { id: string; email: string; name: string | null };
  plans?: {
    id: string;
    name: string;
    price_cents: number;
    classes_per_month: number | null;
  };
}

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<'users' | 'memberships' | 'plans' | 'calendar'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [membershipEditId, setMembershipEditId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [showCreateMembership, setShowCreateMembership] = useState(false);
  const [newMembership, setNewMembership] = useState({
    userEmail: '',
    plan_id: '',
    credits_remaining: 0,
    end_date: '',
    status: 'ACTIVE',
  });
  const [createFeedback, setCreateFeedback] = useState('');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', description: '', price_cents: 0, classes_per_month: 0 });
  const [planFeedback, setPlanFeedback] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (profile?.role !== 'ADMIN') { router.push('/'); return; }
      setIsAdmin(true);
      fetchData();
    }
    async function fetchData() {
      const [usersRes, membershipsRes, plansRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/memberships'),
        fetch('/api/admin/plans'),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      if (membershipsRes.ok) setMemberships(await membershipsRes.json());
      if (plansRes.ok) setPlans(await plansRes.json());
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  // User management actions
  const handlePromote = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    refreshUsers();
  };
  const handleDemote = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'CLIENTE' }),
    });
    refreshUsers();
  };
  const handleDelete = async (id: string) => {
    setDeleteUserId(id);
  };
  const confirmDelete = async () => {
    if (deleteUserId) {
      await fetch(`/api/admin/users/${deleteUserId}`, { method: 'DELETE' });
      setDeleteUserId(null);
      refreshUsers();
    }
  };
  const cancelDelete = () => setDeleteUserId(null);
  const refreshUsers = async () => {
    const res = await fetch('/api/admin/users');
    setUsers(await res.json());
  };

  // Membership management actions
  const handleCreateMembership = async () => {
    const res = await fetch('/api/admin/memberships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: newMembership.userEmail,
        plan_id: newMembership.plan_id,
        credits_remaining: newMembership.credits_remaining,
        end_date: newMembership.end_date,
        status: newMembership.status,
      }),
    });
    if (res.ok) {
      setCreateFeedback('¡Membresía creada!');
      setTimeout(() => setCreateFeedback(''), 2000);
      setShowCreateMembership(false);
      setNewMembership({ userEmail: '', plan_id: '', credits_remaining: 0, end_date: '', status: 'ACTIVE' });
      refreshMemberships();
    } else {
      const err = await res.json();
      setCreateFeedback(err.error || 'Error al crear membresía');
    }
  };
  const refreshMemberships = async () => {
    const res = await fetch('/api/admin/memberships');
    setMemberships(await res.json());
  };

  // Plan management actions
  const handleCreatePlan = async () => {
    const res = await fetch('/api/admin/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planForm),
    });
    if (res.ok) {
      setPlanFeedback('¡Plan creado!');
      setTimeout(() => setPlanFeedback(''), 2000);
      setShowCreatePlan(false);
      setPlanForm({ name: '', description: '', price_cents: 0, classes_per_month: 0 });
      const res2 = await fetch('/api/admin/plans');
      setPlans(await res2.json());
    } else {
      setPlanFeedback('Error al crear plan');
    }
  };

  const handleEditPlan = (plan: any) => {
    setEditPlanId(plan.id);
    setPlanForm({ name: plan.name, description: plan.description || '', price_cents: plan.price_cents, classes_per_month: plan.classes_per_month || 0 });
  };

  const saveEditPlan = async () => {
    if (editPlanId) {
      const res = await fetch(`/api/admin/plans/${editPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planForm),
      });
      if (res.ok) {
        setPlanFeedback('¡Plan actualizado!');
        setTimeout(() => setPlanFeedback(''), 2000);
        setEditPlanId(null);
        const res2 = await fetch('/api/admin/plans');
        setPlans(await res2.json());
      } else {
        setPlanFeedback('Error al actualizar plan');
      }
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este plan?')) {
      await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      const res2 = await fetch('/api/admin/plans');
      setPlans(await res2.json());
    }
  };

  console.log('Admin state:', { isAdmin, loading });

  if (loading) {
    return <p className="flex items-center justify-center min-h-screen">Cargando...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r shadow-lg p-6 space-y-8">
        <div className="flex items-center space-x-2 mb-8">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold text-blue-600">Admin</span>
        </div>
        <nav className="space-y-4">
          <button onClick={() => setActiveSection('users')} className={`flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full text-left ${activeSection === 'users' ? 'font-bold text-blue-600' : ''}`}>
            <UsersIcon className="h-5 w-5" />
            <span>Usuarios</span>
          </button>
          <button onClick={() => setActiveSection('memberships')} className={`flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full text-left ${activeSection === 'memberships' ? 'font-bold text-blue-600' : ''}`}>
            <CreditCardIcon className="h-5 w-5" />
            <span>Membresías</span>
          </button>
          <button onClick={() => setActiveSection('plans')} className={`flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full text-left ${activeSection === 'plans' ? 'font-bold text-blue-600' : ''}`}>
            <CreditCardIcon className="h-5 w-5" />
            <span>Planes</span>
          </button>
          <button onClick={() => setActiveSection('calendar')} className={`flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full text-left ${activeSection === 'calendar' ? 'font-bold text-blue-600' : ''}`}>
            <span>Calendario</span>
          </button>
        </nav>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Panel de Administración</h1>
        {activeSection === 'calendar' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Gestión de Calendario y Clases</h2>
            {/* Render the calendar manager page in an iframe for now */}
            <iframe src="/admin/calendar" style={{ width: '100%', height: '600px', border: 'none' }} title="Calendar Management" />
          </section>
        )}
        {activeSection === 'users' && (
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4 space-x-2">
              <UsersIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Usuarios</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border rounded">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Email</th>
                    <th className="py-2 px-4 border-b">Admin</th>
                    <th className="py-2 px-4 border-b">Creado</th>
                    <th className="py-2 px-4 border-b">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-2 px-4">{user.email}</td>
                      <td className="py-2 px-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded">
                            <ShieldCheckIcon className="h-4 w-4 mr-1" /> Admin
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded">{user.role}</span>
                        )}
                      </td>
                      <td className="py-2 px-4">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                      <td className="py-2 px-4 space-x-2">
                        {user.role !== 'ADMIN' && (
                          <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition" onClick={() => handlePromote(user.id)}>Promover</button>
                        )}
                        {user.role === 'ADMIN' && (
                          <button className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition" onClick={() => handleDemote(user.id)}>Quitar Admin</button>
                        )}
                        <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition" onClick={() => handleDelete(user.id)}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Modal for delete confirmation */}
            {deleteUserId && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">¿Seguro que quieres eliminar este usuario?</h3>
                  <div className="flex justify-end space-x-2">
                    <button className="bg-gray-300 px-4 py-2 rounded" onClick={cancelDelete}>Cancelar</button>
                    <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={confirmDelete}>Eliminar</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
        {activeSection === 'memberships' && (
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4 space-x-2">
              <CreditCardIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Membresías</h2>
            </div>
            <button className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition" onClick={() => setShowCreateMembership(true)}>
              Crear Membresía
            </button>
            {/* Create Membership Modal */}
            {showCreateMembership && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Crear Membresía</h3>
                  <div className="mb-2">
                    <label className="block mb-1">Email del usuario</label>
                    <input type="email" className="border rounded px-2 py-1 w-full" value={newMembership.userEmail} onChange={e => setNewMembership({ ...newMembership, userEmail: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Plan</label>
                    <select className="border rounded px-2 py-1 w-full" value={newMembership.plan_id} onChange={e => setNewMembership({ ...newMembership, plan_id: e.target.value })}>
                      <option value="">Selecciona un plan</option>
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Créditos</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={newMembership.credits_remaining} onChange={e => setNewMembership({ ...newMembership, credits_remaining: Number(e.target.value) })} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Fecha de fin</label>
                    <input type="date" className="border rounded px-2 py-1 w-full" value={newMembership.end_date} onChange={e => setNewMembership({ ...newMembership, end_date: e.target.value })} />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Estado</label>
                    <select className="border rounded px-2 py-1 w-full" value={newMembership.status} onChange={e => setNewMembership({ ...newMembership, status: e.target.value })}>
                      <option value="ACTIVE">Activa</option>
                      <option value="EXPIRED">Expirada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  </div>
                  {createFeedback && <div className="mb-2 text-green-600">{createFeedback}</div>}
                  <div className="flex justify-end space-x-2">
                    <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowCreateMembership(false)}>Cancelar</button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCreateMembership}>Crear</button>
                  </div>
                </div>
              </div>
            )}
            <ul className="space-y-2">
              {memberships.map((membership) => (
                <li key={membership.id} className="border rounded p-2 flex flex-col md:flex-row justify-between items-center">
                  <div className="flex-1">
                    <div><span className="font-bold">Plan:</span> {membership.plans?.name ?? '-'}</div>
                    <div><span className="font-bold">Email:</span> {membership.users?.email ?? '-'}</div>
                    <div><span className="font-bold">Créditos:</span> {membership.credits_remaining ?? '-'}</div>
                    <div><span className="font-bold">Fin:</span> {membership.end_date ? new Date(membership.end_date).toLocaleDateString() : '-'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={membership.status === 'ACTIVE' ? "px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded" : "px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded"}>
                      {membership.status}
                    </span>
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={() => {
                      setMembershipEditId(membership.id);
                      setEditCredits(membership.credits_remaining ?? 0);
                      setEditStatus(membership.status);
                    }}>Editar</button>
                  </div>
                </li>
              ))}
            </ul>
            {/* Membership edit modal */}
            {membershipEditId && (
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
                    <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setMembershipEditId(null)}>Cancelar</button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={async () => {
                      if (membershipEditId) {
                        const res = await fetch(`/api/admin/memberships/${membershipEditId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ credits_remaining: editCredits, status: editStatus }),
                        });
                        if (res.ok) {
                          setEditFeedback('¡Membresía actualizada!');
                          setTimeout(() => setEditFeedback(''), 2000);
                          setMembershipEditId(null);
                          refreshMemberships();
                        } else {
                          setEditFeedback('Error al actualizar membresía');
                        }
                      }
                    }}>Guardar</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
        {activeSection === 'plans' && (
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4 space-x-2">
              <CreditCardIcon className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold">Planes</h2>
            </div>
            <button className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition" onClick={() => setShowCreatePlan(true)}>
              Crear Plan
            </button>
            {/* Create Plan Modal */}
            {showCreatePlan && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Crear Plan</h3>
                  <div className="mb-2">
                    <label className="block mb-1">Nombre</label>
                    <input type="text" className="border rounded px-2 py-1 w-full" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Descripción</label>
                    <input type="text" className="border rounded px-2 py-1 w-full" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Precio (centavos)</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={planForm.price_cents} onChange={e => setPlanForm({ ...planForm, price_cents: Number(e.target.value) })} />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Clases por mes</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={planForm.classes_per_month} onChange={e => setPlanForm({ ...planForm, classes_per_month: Number(e.target.value) })} />
                  </div>
                  {planFeedback && <div className="mb-2 text-green-600">{planFeedback}</div>}
                  <div className="flex justify-end space-x-2">
                    <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowCreatePlan(false)}>Cancelar</button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={handleCreatePlan}>Crear</button>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Plan Modal */}
            {editPlanId && (
              <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                  <h3 className="text-lg font-bold mb-4">Editar Plan</h3>
                  <div className="mb-2">
                    <label className="block mb-1">Nombre</label>
                    <input type="text" className="border rounded px-2 py-1 w-full" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Descripción</label>
                    <input type="text" className="border rounded px-2 py-1 w-full" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1">Precio (centavos)</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={planForm.price_cents} onChange={e => setPlanForm({ ...planForm, price_cents: Number(e.target.value) })} />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Clases por mes</label>
                    <input type="number" className="border rounded px-2 py-1 w-full" value={planForm.classes_per_month} onChange={e => setPlanForm({ ...planForm, classes_per_month: Number(e.target.value) })} />
                  </div>
                  {planFeedback && <div className="mb-2 text-green-600">{planFeedback}</div>}
                  <div className="flex justify-end space-x-2">
                    <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setEditPlanId(null)}>Cancelar</button>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={saveEditPlan}>Guardar</button>
                  </div>
                </div>
              </div>
            )}
            <ul className="space-y-2">
              {plans.map((plan) => (
                <li key={plan.id} className="border rounded p-2 flex flex-col md:flex-row justify-between items-center">
                  <div className="flex-1">
                    <div><span className="font-bold">Nombre:</span> {plan.name}</div>
                    <div><span className="font-bold">Descripción:</span> {plan.description || '-'}</div>
                    <div><span className="font-bold">Precio:</span> ${(plan.price_cents / 100).toFixed(2)}</div>
                    <div><span className="font-bold">Clases/mes:</span> {plan.classes_per_month ?? 'Ilimitado'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition" onClick={() => handleEditPlan(plan)}>Editar</button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition" onClick={() => handleDeletePlan(plan.id)}>Eliminar</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}