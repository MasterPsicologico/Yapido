'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function Home() {
  const { user, isPassenger, isDriver } = useAuth();

  if (!user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <h1 className="text-3xl font-bold">
          Yapido <span className="text-primary">Movilidad</span>
        </h1>
        <p className="text-muted-foreground text-center max-w-sm">
          Tu viaje en moto o auto, en minutos. Disponible en Aguachica, Cesar.
        </p>
        <Link href="/auth" className="btn-primary w-full max-w-xs">
          Ingresar
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col p-6 gap-4 pt-safe">
      <header>
        <h1 className="text-2xl font-bold">Hola, {user.displayName}</h1>
        <p className="text-muted-foreground">¿A dónde vamos hoy?</p>
      </header>
      <div className="grid grid-cols-1 gap-3 mt-6">
        {isPassenger && (
          <Link href="/(passenger)/home" className="card hover:bg-secondary/50 transition">
            <h2 className="text-lg font-semibold">Pedir un viaje</h2>
            <p className="text-sm text-muted-foreground">Moto o auto, tú eliges.</p>
          </Link>
        )}
        {isDriver && (
          <Link href="/(driver)/home" className="card hover:bg-secondary/50 transition">
            <h2 className="text-lg font-semibold">Conducir</h2>
            <p className="text-sm text-muted-foreground">Empieza a recibir viajes.</p>
          </Link>
        )}
      </div>
    </main>
  );
}

