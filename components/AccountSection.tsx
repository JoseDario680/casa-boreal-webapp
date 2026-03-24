import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { createBrowserClient } from '@supabase/ssr';

const AccountSection = () => {
  const { register, handleSubmit, watch, reset } = useForm();
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const onSubmit = async (data: Record<string, any>) => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (error) throw error;
      toast.success('Contraseña actualizada exitosamente');
      reset();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al actualizar la contraseña');
      }
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isLongEnough = password.length >= 8;
    return hasUpperCase && hasNumber && isLongEnough;
  };

  const newPassword = watch('newPassword');

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Cuenta</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
          <input
            type="password"
            {...register('newPassword', {
              required: true,
              validate: validatePassword,
            })}
            className="w-full border rounded-lg p-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: true,
              validate: (value: string) => value === newPassword || 'Las contraseñas no coinciden',
            })}
            className="w-full border rounded-lg p-2"
          />
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-casaOlive text-white px-4 py-2 rounded-lg"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AccountSection;