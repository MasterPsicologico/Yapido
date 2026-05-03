
"use client";

import Link from 'next/link';
import { UserCircle, LogOut, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NavbarUserMenuProps {
  user: any;
  profile: any;
  canAccessManage: boolean;
  onLogout: () => void;
}

export function NavbarUserMenu({ user, profile, canAccessManage, onLogout }: NavbarUserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 shrink-0 border-2 border-white shadow-md hover:border-primary/20 transition-all bg-white overflow-hidden">
          <Avatar className="h-full w-full">
            <AvatarImage src={profile?.photoURL || user.photoURL || ''} className="object-cover" />
            <AvatarFallback className="font-black text-[10px] bg-slate-100 text-primary uppercase">
              {user.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
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
          <Link href="/profile" className="flex items-center h-11 px-3 rounded-xl hover:bg-primary/5 transition-colors group">
            <UserCircle className="mr-3 h-4 w-4 text-primary" />
            <span className="font-bold text-slate-700 group-hover:text-primary transition-colors text-xs">Mi Perfil</span>
          </Link>
          
          {canAccessManage && (
            <Link href="/admin/agents" className="flex items-center h-11 px-3 rounded-xl hover:bg-primary/5 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center mr-3 group-hover:bg-primary transition-colors">
                <Cpu className="h-3.5 w-3.5 text-primary group-hover:text-white" />
              </div>
              <span className="font-black text-slate-600 group-hover:text-primary transition-colors text-[10px] uppercase tracking-wider italic">Ciudadela de Agentes</span>
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
