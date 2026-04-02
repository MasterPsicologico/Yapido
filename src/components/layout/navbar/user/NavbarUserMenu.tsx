
"use client";

import Link from 'next/link';
import { UserCircle, LogOut, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";

interface NavbarUserMenuProps {
  user: any;
  profile: any;
  canAccessManage: boolean;
  onLogout: () => void;
}

export function NavbarUserMenu({ user, profile, canAccessManage, onLogout }: NavbarUserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 shrink-0 border-2 border-white shadow-md hover:border-primary/20 transition-all bg-white">
          <Avatar className="h-full w-full">
            <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
            <AvatarFallback className="font-black text-[10px] bg-slate-100 text-primary">U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent className="w-64 p-2 rounded-[28px] shadow-2xl mt-2 border-none z-[500]" align="end">
          <DropdownMenuLabel className="font-normal p-4">
            <p className="text-sm font-black italic text-slate-900">{profile?.displayName || user.displayName}</p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">{user.email}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-50" />
          <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer focus:bg-primary/5">
            <Link href="/profile" className="flex items-center">
              <UserCircle className="mr-3 h-4 w-4 text-primary" />
              <span className="font-bold text-slate-700">Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          
          {canAccessManage && (
            <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer focus:bg-primary/5 bg-primary/5">
              <Link href="/admin/manage" className="flex items-center">
                <LayoutGrid className="mr-3 h-4 w-4 text-primary" />
                <span className="font-black italic uppercase tracking-tighter text-primary text-[11px]">Gestionar Mi Negocio</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-slate-50" />
          <DropdownMenuItem onClick={onLogout} className="text-red-500 rounded-xl h-11 cursor-pointer hover:bg-red-50 hover:text-red-600">
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-bold">Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
