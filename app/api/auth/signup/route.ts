import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// NOTE: Signup is now handled client-side via supabase.auth.signUp().
// This route is kept as a server fallback if needed.
export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña son requeridos.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || '' },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuario creado exitosamente.', userId: data.user?.id });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}