import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

const ProfileSection = () => {
  const { register, handleSubmit, reset } = useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) throw new Error('Error al cargar el perfil');
        const data = await response.json();
        reset(data);
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Error desconocido');
        }
      }
    };
    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: Record<string, any>) => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Error al guardar los cambios');
      toast.success('Cambios guardados exitosamente');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error desconocido');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Perfil</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nombre completo</label>
          <input
            type="text"
            {...register('name')}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            {...register('email')}
            className="w-full border rounded-lg p-2"
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            {...register('phone')}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            {...register('birthDate')}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Género</label>
          <select {...register('gender')} className="w-full border rounded-lg p-2">
            <option value="">Prefiero no decir</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-casaCoffee hover:brightness-110 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            className="border-2 border-casaCoffee/20 text-casaCoffee px-5 py-2.5 rounded-xl font-semibold hover:bg-casaBeige transition-all"
            onClick={() => reset()}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSection;