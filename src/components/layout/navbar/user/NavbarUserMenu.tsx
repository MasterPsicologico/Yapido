"use client";

import Link from 'next/link';
import { UserCircle, LogOut, LayoutGrid, Waves, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

interface NavbarUserMenuProps {
  user: any;
  profile: any;
  canAccessManage: boolean;
  onLogout: () => void;
}

export function NavbarUserMenu({ user, profile, canAccessManage, onLogout }: NavbarUserMenuProps) {
  const firestore = useFirestore();

  // BUSCADOR AUTOMÁTICO DE VITRINA DE LAVADORAS (CUADERNO DIGITAL)
  const washerStoreQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'stores'),
      where('ownerId', '==', user.uid),
      where('type', '==', 'washer_rental'),
      limit(1)
    );
  }, [firestore, user?.uid]);

  const { data: ownedWasherStores } = useCollection(washerStoreQuery);
  
  // Determinamos el ID de la lavadora: o es del repartidor (vinculado) o es del dueño (propio)
  const washerStoreId = profile?.linkedStoreId || ownedWasherStores?.[0]?.id;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 shrink-0 border-2 border-white shadow-md hover:border-primary/20 transition-all bg-white">
          <Avatar className="h-full w-full">
            <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
            <AvatarFallback className="font-black text-[10px] bg-slate-100 text-primary">U</AvatarFallback>
          </Avatar>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 rounded-[28px] shadow-2xl mt-2 border-none z-[1000]" align="end">
        <div className="font-normal p-4">
          <p className="text-sm font-black italic text-slate-900">{profile?.displayName || user.displayName}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{user.email}</p>
        </div>
        
        <div className="h-px bg-slate-50 mx-2" />
        
        <div className="p-1 space-y-1">
          {/* ENLACE MAESTRO: MI CUADERNO DE LAVADORAS DIGITAL (INTELIGENTE) */}
          {washerStoreId && (
            <Link 
              href={`/admin/washer/${washerStoreId}`} 
              className="flex items-center h-12 px-3 rounded-xl bg-slate-950 text-white hover:bg-black transition-all shadow-xl group border-b-2 border-primary/20"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mr-3 group-hover:bg-primary transition-colors">
                <BookOpen className="h-4 w-4 text-primary group-hover:text-white" />
              </div>
              <span className="font-black italic uppercase tracking-tighter text-[10px] leading-tight">
                Mi cuaderno de <br /> lavadoras digital
              </span>
            </Link>
          )}

          <Link href="/profile" className="flex items-center h-11 px-3 rounded-xl hover:bg-primary/5 transition-colors group">
            <UserCircle className="mr-3 h-4 w-4 text-primary" />
            <span className="font-bold text-slate-700 group-hover:text-primary transition-colors text-xs">Mi Perfil</span>
          </Link>
          
          {canAccessManage && (
            <Link href="/admin/manage" className="flex items-center h-11 px-3 rounded-xl hover:bg-slate-50 transition-all group">
              <Waves className="mr-3 h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="font-bold text-slate-500 group-hover:text-slate-900 text-xs uppercase tracking-tighter">Consola de Mando</span>
            </Link>
          )}
        </div>

        <div className="h-px bg-slate-50 mx-2" />
        <div className="p-1">
          <button onClick={onLogout} className="flex items-center w-full h-11 px-3 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-bold text-xs">Cerrar Sesión</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
