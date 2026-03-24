'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (password.length < 6) {
      setIsError(true);
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setIsError(true);
      setMessage(error.message || 'Error al crear la cuenta.');
    } else {
      setIsError(false);
      setMessage('¡Cuenta creada! Revisa tu correo para verificar tu cuenta.');
      setTimeout(() => router.push('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <main className="bg-gradient-to-br from-casaBeige via-casaCream to-casaBeige min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full border border-casaCoffee/20">
        <h1 className="text-4xl font-heading text-casaCoffee mb-8 text-center">Crear Cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-casaCoffee">Nombre completo</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 block w-full border border-casaCoffee/20 rounded-lg p-3 focus:ring-casaOlive focus:border-casaOlive shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-casaCoffee">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 block w-full border border-casaCoffee/20 rounded-lg p-3 focus:ring-casaOlive focus:border-casaOlive shadow-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-casaCoffee">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 block w-full border border-casaCoffee/20 rounded-lg p-3 focus:ring-casaOlive focus:border-casaOlive shadow-sm"
              required
              minLength={6}
            />
            <p className="text-xs text-casaCoffee/50 mt-1">Mínimo 6 caracteres</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-casaCoffee text-casaBeige py-3 rounded-lg font-medium hover:bg-casaOlive transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>
        {message && (
          <p className={`mt-6 text-center ${isError ? 'text-red-500' : 'text-green-600'}`}>{message}</p>
        )}
        <div className="mt-6 text-center">
          <p className="text-sm text-casaCoffee">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="text-casaOlive font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}