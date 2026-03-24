'use client';

import { useState, useEffect } from 'react';
import { UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    refreshUsers();
  }, []);

  const handleToggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'CLIENTE' : 'ADMIN';
    await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    refreshUsers();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este usuario?')) {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      refreshUsers();
    }
  };

  const refreshUsers = async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-4 space-x-2">
        <UsersIcon className="h-6 w-6 text-blue-500" />
        <h1 className="text-2xl font-bold">Administrar Usuarios</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Nombre</th>
              <th className="py-2 px-4 border-b">Rol</th>
              <th className="py-2 px-4 border-b">Creado</th>
              <th className="py-2 px-4 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4">{user.name ?? '-'}</td>
                <td className="py-2 px-4">
                  {user.role === 'ADMIN' ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-green-100 text-green-700 rounded">
                      <ShieldCheckIcon className="h-4 w-4 mr-1" /> Admin
                    </span>
                  ) : user.role === 'INSTRUCTOR' ? (
                    <span className="inline-block px-2 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded">Instructor</span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-bold bg-gray-200 text-gray-700 rounded">Cliente</span>
                  )}
                </td>
                <td className="py-2 px-4">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                <td className="py-2 px-4 space-x-2">
                  {user.role !== 'ADMIN' ? (
                    <button className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition" onClick={() => handleToggleRole(user.id, user.role)}>Promover</button>
                  ) : (
                    <button className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 transition" onClick={() => handleToggleRole(user.id, user.role)}>Quitar Admin</button>
                  )}
                  <button className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition" onClick={() => handleDelete(user.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
