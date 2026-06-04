'use client';

import { useAuth } from '@/hooks/useAuth';
import { LogOut, CreditCard, MapPin, HelpCircle, Phone } from 'lucide-react';
import { firebaseAuth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const setUser = useUserStore((s) => s.setUser);

  if (!user) return null;

  return (
    <main className="min-h-screen p-4 pt-safe">
      <h1 className="text-2xl font-bold mb-4">Mi perfil</h1>

      <div className="card flex items-center gap-3 mb-4">
        <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
          {user.displayName?.[0]?.toUpperCase() ?? 'Y'}
        </div>
        <div>
          <p className="font-semibold">{user.displayName}</p>
          <p className="text-sm text-muted-foreground">{user.phone ?? user.email}</p>
        </div>
      </div>

      <ul className="card divide-y divide-border !p-0">
        <Item icon={<CreditCard className="h-5 w-5" />} label="Métodos de pago" />
        <Item icon={<MapPin className="h-5 w-5" />} label="Direcciones guardadas" />
        <Item icon={<HelpCircle className="h-5 w-5" />} label="Ayuda y soporte" />
        <Item icon={<Phone className="h-5 w-5" />} label="Términos y privacidad" />
      </ul>

      <button
        onClick={async () => {
          await signOut(firebaseAuth());
          setUser(null);
          router.push('/m');
        }}
        className="mt-6 w-full h-12 rounded-xl border border-destructive text-destructive font-semibold flex items-center justify-center gap-2 hover:bg-destructive/5"
      >
        <LogOut className="h-5 w-5" /> Cerrar sesión
      </button>
    </main>
  );
}

function Item({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-3 p-4 hover:bg-secondary/40 cursor-pointer">
      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">{icon}</div>
      <span className="font-medium">{label}</span>
    </li>
  );
}

