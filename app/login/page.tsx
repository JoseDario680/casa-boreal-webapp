'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '@/app/globals.css';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsError(true);
      setMessage('Error al iniciar sesión. Verifica tus credenciales.');
    } else {
      setIsError(false);
      setMessage('Inicio de sesión exitoso.');
      setTimeout(() => router.push('/dashboard'), 1000);
    }
    setLoading(false);
  };

  return (
    <main className="bg-gradient-to-br from-casaBeige via-casaCream to-casaBeige min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-xl rounded-3xl p-10 max-w-md w-full border border-casaCoffee/20">
        <h1 className="text-4xl font-heading text-casaCoffee mb-8 text-center">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-casaCoffee text-casaBeige py-3 rounded-lg font-medium hover:bg-casaOlive transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
        {message && (
          <p className={`mt-6 text-center ${isError ? 'text-red-500' : 'text-green-600'}`}>{message}</p>
        )}
        <div className="mt-6 text-center">
          <p className="text-sm text-casaCoffee">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="text-casaOlive font-medium hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}