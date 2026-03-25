'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Users, CreditCard, Calendar, Tag, Shield, Plus, Pencil,
  Trash2, X, Loader2, ChevronRight, ChevronLeft, ShieldCheck, ShieldOff, UserX,
  Clock, User as UserIcon,
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale/es';

/* ──────────── Types ──────────── */
interface UserRow {
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
  plans?: { id: string; name: string; price_cents: number; classes_per_month: number | null };
}
interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  classes_per_month: number | null;
  is_active: boolean;
}
interface ClassEvent {
  id: string;
  name: string;
  instructor: { id: string; name: string } | null;
  instructor_id: string | null;
  level: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked: number;
  recurrence?: string;
}
type Section = 'users' | 'memberships' | 'plans' | 'calendar';

/* ──────────── Nav ──────────── */
const navItems: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: 'users', label: 'Usuarios', icon: <Users size={20} /> },
  { key: 'memberships', label: 'Membresías', icon: <CreditCard size={20} /> },
  { key: 'plans', label: 'Planes', icon: <Tag size={20} /> },
  { key: 'calendar', label: 'Calendario', icon: <Calendar size={20} /> },
];

/* ──────────── Tiny reusable components ──────────── */
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'default' | 'info' }) => {
  const s: Record<string, string> = {
    success: 'bg-casaOlive/20 text-casaOlive',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-casaCoffee/10 text-casaCoffee',
    default: 'bg-casaBeige text-casaCoffee/70',
  };
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s[variant]}`}>{children}</span>;
};

const Modal = ({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-lg' : 'max-w-md'} overflow-hidden animate-fade-in max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-casaBeige flex-shrink-0">
          <h3 className="font-heading text-xl text-casaCoffee">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-casaBeige transition"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const InputField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div>
    <label className="block text-sm font-medium text-casaCoffee/80 mb-1">{label}</label>
    <input {...props} className="w-full rounded-xl border border-casaBeige bg-casaCream/50 px-4 py-2.5 text-casaCoffee placeholder:text-casaCoffee/40 focus:outline-none focus:ring-2 focus:ring-casaOlive/40 focus:border-casaOlive transition" />
  </div>
);

const SelectField = ({ label, children, ...props }: { label: string; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div>
    <label className="block text-sm font-medium text-casaCoffee/80 mb-1">{label}</label>
    <select {...props} className="w-full rounded-xl border border-casaBeige bg-casaCream/50 px-4 py-2.5 text-casaCoffee focus:outline-none focus:ring-2 focus:ring-casaOlive/40 focus:border-casaOlive transition appearance-none">
      {children}
    </select>
  </div>
);

const Btn = ({ variant = 'primary', size = 'md', children, className = '', ...props }: { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  const sz: Record<string, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm' };
  const v: Record<string, string> = {
    primary: 'bg-casaCoffee text-white hover:bg-casaCoffee/90 shadow-sm',
    secondary: 'bg-casaOlive text-white hover:bg-casaOlive/90 shadow-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    ghost: 'bg-casaBeige/60 text-casaCoffee hover:bg-casaBeige',
  };
  return <button className={`${base} ${sz[size]} ${v[variant]} ${className}`} {...props}>{children}</button>;
};

const LevelBadge = ({ level }: { level: string }) => {
  if (level === 'Principiante') return <Badge variant="success">{level}</Badge>;
  if (level === 'Intermedio') return <Badge variant="warning">{level}</Badge>;
  if (level === 'Avanzado') return <Badge variant="danger">{level}</Badge>;
  return <Badge>{level}</Badge>;
};

const LEVEL_DOT: Record<string, string> = {
  Principiante: 'bg-emerald-500',
  Intermedio: 'bg-amber-500',
  Avanzado: 'bg-rose-500',
  'Todos los niveles': 'bg-sky-500',
};

/* ══════════════════════════════════════════════
   MAIN ADMIN PANEL
   ══════════════════════════════════════════════ */
export default function AdminPanel() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>('users');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [classes, setClasses] = useState<ClassEvent[]>([]);

  /* User state */
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  /* Membership state */
  const [membershipEditId, setMembershipEditId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState(0);
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editFeedback, setEditFeedback] = useState('');
  const [showCreateMembership, setShowCreateMembership] = useState(false);
  const [newMembership, setNewMembership] = useState({ userEmail: '', plan_id: '', credits_remaining: 0, end_date: '', status: 'ACTIVE' });
  const [createFeedback, setCreateFeedback] = useState('');

  /* Plan state */
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({ name: '', description: '', price_cents: 0, classes_per_month: 0 });
  const [planFeedback, setPlanFeedback] = useState('');

  /* Calendar state */
  const [calWeekStart, setCalWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showClassModal, setShowClassModal] = useState(false);
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({
    name: '', instructor_id: '', level: 'Principiante',
    date: '', time_start: '09:00', time_end: '10:00',
    capacity: 15, recurrence: 'NONE',
  });
  const [classFeedback, setClassFeedback] = useState('');
  const [classDetailId, setClassDetailId] = useState<string | null>(null);

  /* Instructors derived from users */
  const instructors = useMemo(
    () => users.filter(u => u.role === 'INSTRUCTOR' || u.role === 'ADMIN'),
    [users]
  );

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
      if (profile?.role !== 'ADMIN') { router.push('/'); return; }
      await fetchAll();
      setLoading(false);
    })();
  }, [router]);

  const fetchAll = async () => {
    const [u, m, p, c] = await Promise.all([
      fetch('/api/admin/users').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/memberships').then(r => r.ok ? r.json() : []),
      fetch('/api/admin/plans').then(r => r.ok ? r.json() : []),
      fetch('/api/classes').then(r => r.ok ? r.json() : []),
    ]);
    setUsers(u); setMemberships(m); setPlans(p); setClasses(c);
  };
  const refreshUsers = async () => { const r = await fetch('/api/admin/users'); if (r.ok) setUsers(await r.json()); };
  const refreshMemberships = async () => { const r = await fetch('/api/admin/memberships'); if (r.ok) setMemberships(await r.json()); };
  const refreshPlans = async () => { const r = await fetch('/api/admin/plans'); if (r.ok) setPlans(await r.json()); };
  const refreshClasses = async () => { const r = await fetch('/api/classes'); if (r.ok) setClasses(await r.json()); };

  /* ── User actions ── */
  const toggleRole = async (id: string, current: string) => {
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: current === 'ADMIN' ? 'CLIENTE' : 'ADMIN' }) });
    refreshUsers();
  };
  const setInstructorRole = async (id: string, current: string) => {
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: current === 'INSTRUCTOR' ? 'CLIENTE' : 'INSTRUCTOR' }) });
    refreshUsers();
  };
  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;
    await fetch(`/api/admin/users/${deleteUserId}`, { method: 'DELETE' });
    setDeleteUserId(null); refreshUsers();
  };

  /* ── Membership actions ── */
  const handleCreateMembership = async () => {
    const res = await fetch('/api/admin/memberships', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMembership) });
    if (res.ok) {
      setCreateFeedback('¡Membresía creada!'); setTimeout(() => setCreateFeedback(''), 2000);
      setShowCreateMembership(false); setNewMembership({ userEmail: '', plan_id: '', credits_remaining: 0, end_date: '', status: 'ACTIVE' });
      refreshMemberships();
    } else { const err = await res.json(); setCreateFeedback(err.error || 'Error'); }
  };
  const saveMembershipEdit = async () => {
    if (!membershipEditId) return;
    const res = await fetch(`/api/admin/memberships/${membershipEditId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credits_remaining: editCredits, status: editStatus }) });
    if (res.ok) { setEditFeedback('¡Actualizada!'); setTimeout(() => setEditFeedback(''), 2000); setMembershipEditId(null); refreshMemberships(); }
    else setEditFeedback('Error');
  };

  /* ── Plan actions ── */
  const handleCreatePlan = async () => {
    const res = await fetch('/api/admin/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planForm) });
    if (res.ok) { setPlanFeedback('¡Plan creado!'); setTimeout(() => setPlanFeedback(''), 2000); setShowCreatePlan(false); setPlanForm({ name: '', description: '', price_cents: 0, classes_per_month: 0 }); refreshPlans(); }
    else setPlanFeedback('Error');
  };
  const handleEditPlan = (plan: Plan) => { setEditPlanId(plan.id); setPlanForm({ name: plan.name, description: plan.description || '', price_cents: plan.price_cents, classes_per_month: plan.classes_per_month || 0 }); };
  const saveEditPlan = async () => {
    if (!editPlanId) return;
    const res = await fetch(`/api/admin/plans/${editPlanId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(planForm) });
    if (res.ok) { setPlanFeedback('¡Plan actualizado!'); setTimeout(() => setPlanFeedback(''), 2000); setEditPlanId(null); refreshPlans(); }
    else setPlanFeedback('Error');
  };
  const handleDeletePlan = async (id: string) => { if (!confirm('¿Eliminar este plan?')) return; await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' }); refreshPlans(); };

  /* ── Class actions ── */
  const openNewClassModal = (date?: Date) => {
    setEditClassId(null);
    setClassForm({
      name: '', instructor_id: '', level: 'Principiante',
      date: date ? format(date, 'yyyy-MM-dd') : '',
      time_start: '09:00', time_end: '10:00',
      capacity: 15, recurrence: 'NONE',
    });
    setClassFeedback('');
    setShowClassModal(true);
  };
  const openEditClassModal = (cls: ClassEvent) => {
    setEditClassId(cls.id);
    const st = new Date(cls.start_time);
    const et = new Date(cls.end_time);
    setClassForm({
      name: cls.name,
      instructor_id: cls.instructor_id || cls.instructor?.id || '',
      level: cls.level,
      date: format(st, 'yyyy-MM-dd'),
      time_start: format(st, 'HH:mm'),
      time_end: format(et, 'HH:mm'),
      capacity: cls.capacity,
      recurrence: cls.recurrence || 'NONE',
    });
    setClassFeedback('');
    setShowClassModal(true);
  };
  const handleSaveClass = async () => {
    if (!classForm.name || !classForm.date || !classForm.time_start || !classForm.time_end) {
      setClassFeedback('Completa todos los campos requeridos');
      return;
    }
    const start_time = new Date(`${classForm.date}T${classForm.time_start}:00`).toISOString();
    const end_time = new Date(`${classForm.date}T${classForm.time_end}:00`).toISOString();
    const payload = {
      name: classForm.name,
      instructor_id: classForm.instructor_id || null,
      level: classForm.level,
      start_time, end_time,
      capacity: classForm.capacity,
      recurrence: classForm.recurrence,
    };
    const url = editClassId ? `/api/classes/${editClassId}` : '/api/classes';
    const method = editClassId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      setClassFeedback(editClassId ? '¡Clase actualizada!' : '¡Clase creada!');
      setTimeout(() => { setShowClassModal(false); setClassFeedback(''); }, 800);
      refreshClasses();
    } else {
      const err = await res.json();
      setClassFeedback(err.error || 'Error al guardar');
    }
  };
  const handleDeleteClass = async (id: string) => {
    if (!confirm('¿Eliminar esta clase? Se cancelarán las reservas.')) return;
    const r = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    if (r.ok) { refreshClasses(); setClassDetailId(null); } else alert('Error al eliminar');
  };

  /* ── Calendar helpers ── */
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(calWeekStart, i));
  const classesForDay = (day: Date) =>
    classes
      .filter(c => isSameDay(new Date(c.start_time), day))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const selectedClassDetail = classDetailId ? classes.find(c => c.id === classDetailId) : null;

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-casaCream"><Loader2 className="animate-spin text-casaCoffee" size={32} /></div>;

  return (
    <div className="min-h-screen bg-casaCream flex">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex flex-col w-72 bg-white/80 backdrop-blur border-r border-casaBeige flex-shrink-0">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-casaBeige">
          <div className="w-10 h-10 rounded-xl bg-casaCoffee flex items-center justify-center"><Shield size={20} className="text-white" /></div>
          <div>
            <p className="font-heading text-xl text-casaCoffee leading-tight">Casa Boreal</p>
            <p className="text-[11px] text-casaCoffee/50 font-medium tracking-wide uppercase">Administración</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeSection === item.key ? 'bg-casaCoffee text-white shadow-md' : 'text-casaCoffee/70 hover:bg-casaBeige/60 hover:text-casaCoffee'}`}>
              {item.icon}{item.label}{activeSection === item.key && <ChevronRight size={16} className="ml-auto" />}
            </button>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-casaBeige">
          <button onClick={() => router.push('/dashboard')} className="text-xs text-casaCoffee/50 hover:text-casaCoffee transition">← Volver al Dashboard</button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-casaBeige px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-casaCoffee flex items-center justify-center"><Shield size={16} className="text-white" /></div>
          <span className="font-heading text-lg text-casaCoffee">Admin</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-casaBeige transition">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl p-6 space-y-2" onClick={e => e.stopPropagation()}>
            <p className="font-heading text-xl text-casaCoffee mb-6">Navegación</p>
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setActiveSection(item.key); setMobileOpen(false); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition ${activeSection === item.key ? 'bg-casaCoffee text-white' : 'text-casaCoffee/70 hover:bg-casaBeige'}`}>
                {item.icon} {item.label}
              </button>
            ))}
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-casaCoffee/50 hover:bg-casaBeige mt-6">
              ← Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="font-heading text-3xl lg:text-4xl text-casaCoffee">{navItems.find(n => n.key === activeSection)?.label}</h1>
            <p className="text-casaCoffee/50 text-sm mt-1">Gestión de {navItems.find(n => n.key === activeSection)?.label.toLowerCase()}</p>
          </div>

          {/* ═══════════ USERS ═══════════ */}
          {activeSection === 'users' && (
            <div className="bg-white rounded-2xl shadow-sm border border-casaBeige overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-casaBeige bg-casaCream/50">
                      <th className="text-left text-xs font-semibold text-casaCoffee/60 uppercase tracking-wider px-6 py-4">Usuario</th>
                      <th className="text-left text-xs font-semibold text-casaCoffee/60 uppercase tracking-wider px-6 py-4">Rol</th>
                      <th className="text-left text-xs font-semibold text-casaCoffee/60 uppercase tracking-wider px-6 py-4 hidden md:table-cell">Registro</th>
                      <th className="text-right text-xs font-semibold text-casaCoffee/60 uppercase tracking-wider px-6 py-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-casaBeige/60">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-casaCream/30 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-casaOlive/20 flex items-center justify-center text-casaOlive font-bold text-sm">{(user.name || user.email)[0].toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-medium text-casaCoffee">{user.name || '—'}</p>
                              <p className="text-xs text-casaCoffee/50">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'ADMIN' ? <Badge variant="success"><ShieldCheck size={12} /> Admin</Badge>
                            : user.role === 'INSTRUCTOR' ? <Badge variant="info"><UserIcon size={12} /> Instructor</Badge>
                            : <Badge>Cliente</Badge>}
                        </td>
                        <td className="px-6 py-4 text-sm text-casaCoffee/60 hidden md:table-cell">{user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {user.role !== 'ADMIN' && (
                              <Btn variant="ghost" size="sm" onClick={() => setInstructorRole(user.id, user.role)} title={user.role === 'INSTRUCTOR' ? 'Quitar rol instructor' : 'Hacer instructor'}>
                                <UserIcon size={13} /> {user.role === 'INSTRUCTOR' ? 'Quitar Inst.' : 'Instructor'}
                              </Btn>
                            )}
                            {user.role !== 'ADMIN'
                              ? <Btn variant="secondary" size="sm" onClick={() => toggleRole(user.id, user.role)}><ShieldCheck size={13} /> Admin</Btn>
                              : <Btn variant="ghost" size="sm" onClick={() => toggleRole(user.id, user.role)}><ShieldOff size={13} /> Quitar</Btn>}
                            <Btn variant="danger" size="sm" onClick={() => setDeleteUserId(user.id)}><UserX size={13} /></Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <Modal open={!!deleteUserId} onClose={() => setDeleteUserId(null)} title="Eliminar usuario">
            <p className="text-casaCoffee/70 mb-6">¿Estás seguro? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-3"><Btn variant="ghost" onClick={() => setDeleteUserId(null)}>Cancelar</Btn><Btn variant="danger" onClick={confirmDeleteUser}><Trash2 size={14} /> Eliminar</Btn></div>
          </Modal>

          {/* ═══════════ MEMBERSHIPS ═══════════ */}
          {activeSection === 'memberships' && (
            <>
              <div className="flex justify-end"><Btn variant="secondary" onClick={() => setShowCreateMembership(true)}><Plus size={16} /> Nueva Membresía</Btn></div>
              <div className="grid gap-4">
                {memberships.length === 0 && <div className="bg-white rounded-2xl border border-casaBeige p-8 text-center text-casaCoffee/50">No hay membresías registradas.</div>}
                {memberships.map(m => (
                  <div key={m.id} className="bg-white rounded-2xl border border-casaBeige p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-casaCoffee/50 text-xs mb-0.5">Plan</p><p className="font-medium text-casaCoffee">{m.plans?.name ?? 'Sin plan'}</p></div>
                      <div><p className="text-casaCoffee/50 text-xs mb-0.5">Usuario</p><p className="font-medium text-casaCoffee">{m.users?.email ?? '—'}</p></div>
                      <div><p className="text-casaCoffee/50 text-xs mb-0.5">Créditos</p><p className="font-medium text-casaCoffee">{m.credits_remaining ?? '∞'}</p></div>
                      <div><p className="text-casaCoffee/50 text-xs mb-0.5">Vence</p><p className="font-medium text-casaCoffee">{m.end_date ? new Date(m.end_date).toLocaleDateString('es-MX') : '—'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : m.status === 'EXPIRED' ? 'warning' : 'danger'}>{m.status === 'ACTIVE' ? 'Activa' : m.status === 'EXPIRED' ? 'Expirada' : 'Cancelada'}</Badge>
                      <Btn variant="ghost" size="sm" onClick={() => { setMembershipEditId(m.id); setEditCredits(m.credits_remaining ?? 0); setEditStatus(m.status); }}><Pencil size={14} /></Btn>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <Modal open={showCreateMembership} onClose={() => setShowCreateMembership(false)} title="Nueva Membresía">
            <div className="space-y-4">
              <InputField label="Email del usuario" type="email" value={newMembership.userEmail} onChange={e => setNewMembership({ ...newMembership, userEmail: e.target.value })} placeholder="usuario@email.com" />
              <SelectField label="Plan" value={newMembership.plan_id} onChange={e => setNewMembership({ ...newMembership, plan_id: e.target.value })}><option value="">Selecciona</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</SelectField>
              <InputField label="Créditos" type="number" value={newMembership.credits_remaining} onChange={e => setNewMembership({ ...newMembership, credits_remaining: Number(e.target.value) })} />
              <InputField label="Fecha de fin" type="date" value={newMembership.end_date} onChange={e => setNewMembership({ ...newMembership, end_date: e.target.value })} />
              <SelectField label="Estado" value={newMembership.status} onChange={e => setNewMembership({ ...newMembership, status: e.target.value })}><option value="ACTIVE">Activa</option><option value="EXPIRED">Expirada</option><option value="CANCELLED">Cancelada</option></SelectField>
              {createFeedback && <p className="text-sm text-casaOlive">{createFeedback}</p>}
              <div className="flex justify-end gap-3 pt-2"><Btn variant="ghost" onClick={() => setShowCreateMembership(false)}>Cancelar</Btn><Btn variant="secondary" onClick={handleCreateMembership}><Plus size={14} /> Crear</Btn></div>
            </div>
          </Modal>
          <Modal open={!!membershipEditId} onClose={() => setMembershipEditId(null)} title="Editar Membresía">
            <div className="space-y-4">
              <InputField label="Créditos" type="number" value={editCredits} onChange={e => setEditCredits(Number(e.target.value))} />
              <SelectField label="Estado" value={editStatus} onChange={e => setEditStatus(e.target.value)}><option value="ACTIVE">Activa</option><option value="EXPIRED">Expirada</option><option value="CANCELLED">Cancelada</option></SelectField>
              {editFeedback && <p className="text-sm text-casaOlive">{editFeedback}</p>}
              <div className="flex justify-end gap-3 pt-2"><Btn variant="ghost" onClick={() => setMembershipEditId(null)}>Cancelar</Btn><Btn variant="primary" onClick={saveMembershipEdit}>Guardar</Btn></div>
            </div>
          </Modal>

          {/* ═══════════ PLANS ═══════════ */}
          {activeSection === 'plans' && (
            <>
              <div className="flex justify-end"><Btn variant="secondary" onClick={() => { setShowCreatePlan(true); setPlanForm({ name: '', description: '', price_cents: 0, classes_per_month: 0 }); }}><Plus size={16} /> Nuevo Plan</Btn></div>
              <div className="grid sm:grid-cols-2 gap-4">
                {plans.map(plan => (
                  <div key={plan.id} className="bg-white rounded-2xl border border-casaBeige p-6 hover:shadow-sm transition">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-heading text-xl text-casaCoffee">{plan.name}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => handleEditPlan(plan)} className="p-1.5 rounded-lg hover:bg-casaBeige transition text-casaCoffee/50 hover:text-casaCoffee"><Pencil size={14} /></button>
                        <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition text-casaCoffee/50 hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-casaCoffee/60 mb-4">{plan.description || 'Sin descripción'}</p>
                    <div className="flex items-baseline gap-1 mb-2"><span className="text-2xl font-bold text-casaCoffee">${(plan.price_cents / 100).toLocaleString('es-MX')}</span><span className="text-sm text-casaCoffee/50">MXN</span></div>
                    <p className="text-sm text-casaCoffee/60">{plan.classes_per_month ? `${plan.classes_per_month} clases/mes` : 'Clases ilimitadas'}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          <Modal open={showCreatePlan || !!editPlanId} onClose={() => { setShowCreatePlan(false); setEditPlanId(null); }} title={editPlanId ? 'Editar Plan' : 'Nuevo Plan'}>
            <div className="space-y-4">
              <InputField label="Nombre" value={planForm.name} onChange={e => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Ej: Barre Plus" />
              <InputField label="Descripción" value={planForm.description} onChange={e => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Descripción del plan" />
              <InputField label="Precio (centavos MXN)" type="number" value={planForm.price_cents} onChange={e => setPlanForm({ ...planForm, price_cents: Number(e.target.value) })} />
              <InputField label="Clases por mes (0 = ilimitado)" type="number" value={planForm.classes_per_month} onChange={e => setPlanForm({ ...planForm, classes_per_month: Number(e.target.value) })} />
              {planFeedback && <p className="text-sm text-casaOlive">{planFeedback}</p>}
              <div className="flex justify-end gap-3 pt-2"><Btn variant="ghost" onClick={() => { setShowCreatePlan(false); setEditPlanId(null); }}>Cancelar</Btn><Btn variant={editPlanId ? 'primary' : 'secondary'} onClick={editPlanId ? saveEditPlan : handleCreatePlan}>{editPlanId ? 'Guardar' : 'Crear'}</Btn></div>
            </div>
          </Modal>

          {/* ═══════════ CALENDAR ═══════════ */}
          {activeSection === 'calendar' && (
            <>
              {/* Week navigation */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button onClick={() => setCalWeekStart(subWeeks(calWeekStart, 1))} className="p-2.5 rounded-xl bg-white border border-casaBeige hover:bg-casaBeige/60 text-casaCoffee transition active:scale-95"><ChevronLeft size={18} /></button>
                  <div className="text-center min-w-[220px]">
                    <p className="font-heading text-lg text-casaCoffee capitalize">
                      {format(calWeekStart, "d MMM", { locale: es })} – {format(addDays(calWeekStart, 6), "d MMM yyyy", { locale: es })}
                    </p>
                  </div>
                  <button onClick={() => setCalWeekStart(addWeeks(calWeekStart, 1))} className="p-2.5 rounded-xl bg-white border border-casaBeige hover:bg-casaBeige/60 text-casaCoffee transition active:scale-95"><ChevronRight size={18} /></button>
                </div>
                <Btn variant="secondary" onClick={() => openNewClassModal()}><Plus size={16} /> Nueva Clase</Btn>
              </div>

              {/* ── Desktop: Weekly calendar grid ── */}
              <div className="hidden md:block bg-white rounded-2xl border border-casaBeige overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-casaBeige bg-casaCream/50">
                  {weekDays.map((day, i) => {
                    const today = isSameDay(day, new Date());
                    return (
                      <div key={i} className={`text-center py-3 border-r border-casaBeige last:border-r-0 ${today ? 'bg-casaOlive/10' : ''}`}>
                        <p className="text-[11px] font-semibold text-casaCoffee/50 uppercase">{format(day, 'EEE', { locale: es })}</p>
                        <p className={`text-lg font-bold ${today ? 'text-casaOlive' : 'text-casaCoffee'}`}>{format(day, 'd')}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Columns with classes */}
                <div className="grid grid-cols-7 min-h-[420px]">
                  {weekDays.map((day, dayIdx) => {
                    const dayC = classesForDay(day);
                    const today = isSameDay(day, new Date());
                    return (
                      <div key={dayIdx}
                        className={`border-r border-casaBeige last:border-r-0 p-1.5 space-y-1.5 cursor-pointer hover:bg-casaCream/30 transition ${today ? 'bg-casaOlive/5' : ''}`}
                        onClick={() => openNewClassModal(day)}>
                        {dayC.map(cls => {
                          const dot = LEVEL_DOT[cls.level] || LEVEL_DOT['Todos los niveles'];
                          return (
                            <div key={cls.id}
                              onClick={e => { e.stopPropagation(); setClassDetailId(cls.id); }}
                              className="bg-casaCream/80 hover:bg-casaBeige border border-casaBeige/60 rounded-xl p-2 cursor-pointer transition-all hover:shadow-sm">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                                <span className="text-xs font-semibold text-casaCoffee truncate">{cls.name}</span>
                              </div>
                              <p className="text-[10px] text-casaCoffee/50 flex items-center gap-1">
                                <Clock size={10} />
                                {format(new Date(cls.start_time), 'HH:mm')}–{format(new Date(cls.end_time), 'HH:mm')}
                              </p>
                              <p className="text-[10px] text-casaCoffee/40 truncate">
                                {cls.instructor?.name || 'Sin instructor'}
                              </p>
                              <p className="text-[10px] text-casaCoffee/40">
                                {cls.booked || 0}/{cls.capacity} reservas
                              </p>
                            </div>
                          );
                        })}
                        {dayC.length === 0 && (
                          <div className="flex items-center justify-center h-full min-h-[60px] opacity-30 hover:opacity-60 transition-opacity">
                            <Plus size={16} className="text-casaCoffee/30" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Mobile: card list view ── */}
              <div className="md:hidden space-y-3">
                {weekDays.map((day, i) => {
                  const dayC = classesForDay(day);
                  const today = isSameDay(day, new Date());
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className={`text-xs font-bold uppercase tracking-wide capitalize ${today ? 'text-casaOlive' : 'text-casaCoffee/50'}`}>
                          {format(day, 'EEEE d', { locale: es })}
                          {today && <span className="ml-1.5 text-[10px] bg-casaOlive/20 text-casaOlive px-1.5 py-0.5 rounded-full normal-case">Hoy</span>}
                        </p>
                        <button onClick={() => openNewClassModal(day)} className="text-casaOlive hover:text-casaCoffee transition p-1"><Plus size={14} /></button>
                      </div>
                      {dayC.length === 0 ? (
                        <div className="bg-white/60 rounded-xl border border-dashed border-casaBeige p-3 text-center text-xs text-casaCoffee/30 mb-2">Sin clases</div>
                      ) : dayC.map(cls => (
                        <div key={cls.id} className="bg-white rounded-xl border border-casaBeige p-3.5 mb-2 active:scale-[0.99] transition-all"
                          onClick={() => setClassDetailId(cls.id)}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${LEVEL_DOT[cls.level] || LEVEL_DOT['Todos los niveles']}`} />
                              <span className="text-sm font-semibold text-casaCoffee truncate">{cls.name}</span>
                              <LevelBadge level={cls.level} />
                            </div>
                            <div className="flex gap-0.5 flex-shrink-0">
                              <button onClick={e => { e.stopPropagation(); openEditClassModal(cls); }} className="p-1.5 rounded-lg hover:bg-casaBeige text-casaCoffee/30 hover:text-casaCoffee"><Pencil size={12} /></button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-casaCoffee/30 hover:text-red-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-casaCoffee/50">
                            <span className="inline-flex items-center gap-1"><Clock size={11} /> {format(new Date(cls.start_time), 'HH:mm')}–{format(new Date(cls.end_time), 'HH:mm')}</span>
                            <span className="inline-flex items-center gap-1"><UserIcon size={11} /> {cls.instructor?.name || 'Sin instructor'}</span>
                            <span>{cls.booked || 0}/{cls.capacity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: classes.length, label: 'Total clases', color: 'text-casaCoffee' },
                  { val: instructors.length, label: 'Instructores', color: 'text-casaOlive' },
                  { val: classes.reduce((s, c) => s + (c.booked || 0), 0), label: 'Reservas', color: 'text-casaCoffee' },
                  { val: classes.reduce((s, c) => s + c.capacity, 0), label: 'Capacidad total', color: 'text-casaCoffee' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-casaBeige p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.val}</p>
                    <p className="text-xs text-casaCoffee/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Class create/edit modal ── */}
          <Modal wide open={showClassModal} onClose={() => setShowClassModal(false)} title={editClassId ? 'Editar Clase' : 'Nueva Clase'}>
            <div className="space-y-4">
              <InputField label="Nombre de la clase *" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} placeholder="Ej: Barre Flow" />

              <SelectField label="Instructor" value={classForm.instructor_id} onChange={e => setClassForm({ ...classForm, instructor_id: e.target.value })}>
                <option value="">— Sin instructor —</option>
                {instructors.map(u => (
                  <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                ))}
              </SelectField>

              {instructors.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                  No hay instructores registrados. Ve a <strong>Usuarios</strong> y asigna el rol de Instructor a alguien.
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Nivel" value={classForm.level} onChange={e => setClassForm({ ...classForm, level: e.target.value })}>
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                  <option value="Todos los niveles">Todos los niveles</option>
                </SelectField>
                <InputField label="Capacidad" type="number" value={classForm.capacity} onChange={e => setClassForm({ ...classForm, capacity: parseInt(e.target.value) || 15 })} min={1} max={50} />
              </div>

              <InputField label="Fecha *" type="date" value={classForm.date} onChange={e => setClassForm({ ...classForm, date: e.target.value })} />

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Hora inicio *" type="time" value={classForm.time_start} onChange={e => setClassForm({ ...classForm, time_start: e.target.value })} />
                <InputField label="Hora fin *" type="time" value={classForm.time_end} onChange={e => setClassForm({ ...classForm, time_end: e.target.value })} />
              </div>

              <SelectField label="Recurrencia" value={classForm.recurrence} onChange={e => setClassForm({ ...classForm, recurrence: e.target.value })}>
                <option value="NONE">Sin repetición</option>
                <option value="WEEKLY">Semanal (se repite cada semana)</option>
              </SelectField>

              {classFeedback && (
                <p className={`text-sm font-medium ${classFeedback.includes('Error') || classFeedback.includes('Completa') ? 'text-red-500' : 'text-casaOlive'}`}>{classFeedback}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Btn variant="ghost" onClick={() => setShowClassModal(false)}>Cancelar</Btn>
                <Btn variant={editClassId ? 'primary' : 'secondary'} onClick={handleSaveClass}>
                  {editClassId ? 'Guardar Cambios' : <><Plus size={14} /> Crear Clase</>}
                </Btn>
              </div>
            </div>
          </Modal>

          {/* ── Class detail modal ── */}
          <Modal open={!!selectedClassDetail} onClose={() => setClassDetailId(null)} title="Detalle de Clase">
            {selectedClassDetail && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h4 className="font-heading text-2xl text-casaCoffee">{selectedClassDetail.name}</h4>
                  <LevelBadge level={selectedClassDetail.level} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-casaCoffee/50 text-xs">Instructor</p>
                    <p className="font-medium text-casaCoffee">{selectedClassDetail.instructor?.name || 'Sin asignar'}</p>
                  </div>
                  <div>
                    <p className="text-casaCoffee/50 text-xs">Reservas / Capacidad</p>
                    <p className="font-medium text-casaCoffee">{selectedClassDetail.booked || 0} / {selectedClassDetail.capacity}</p>
                  </div>
                  <div>
                    <p className="text-casaCoffee/50 text-xs">Fecha</p>
                    <p className="font-medium text-casaCoffee capitalize">{format(new Date(selectedClassDetail.start_time), "EEEE d 'de' MMMM", { locale: es })}</p>
                  </div>
                  <div>
                    <p className="text-casaCoffee/50 text-xs">Horario</p>
                    <p className="font-medium text-casaCoffee">{format(new Date(selectedClassDetail.start_time), 'HH:mm')} – {format(new Date(selectedClassDetail.end_time), 'HH:mm')}</p>
                  </div>
                </div>
                {/* Capacity bar */}
                <div>
                  <div className="flex justify-between text-xs text-casaCoffee/50 mb-1">
                    <span>Ocupación</span>
                    <span>{Math.round(((selectedClassDetail.booked || 0) / selectedClassDetail.capacity) * 100)}%</span>
                  </div>
                  <div className="w-full bg-casaBeige rounded-full h-2.5 overflow-hidden">
                    <div className="bg-casaOlive h-full rounded-full transition-all" style={{ width: `${Math.min(((selectedClassDetail.booked || 0) / selectedClassDetail.capacity) * 100, 100)}%` }} />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Btn variant="danger" size="sm" onClick={() => handleDeleteClass(selectedClassDetail.id)}><Trash2 size={14} /> Eliminar</Btn>
                  <Btn variant="primary" size="sm" onClick={() => { setClassDetailId(null); openEditClassModal(selectedClassDetail); }}><Pencil size={14} /> Editar</Btn>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </main>
    </div>
  );
}
