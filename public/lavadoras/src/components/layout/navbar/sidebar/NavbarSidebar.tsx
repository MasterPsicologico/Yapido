
"use client";

import { Menu, ShoppingBag, LogOut, User, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarNavigation } from './SidebarNavigation';
import { useProfile } from '@/firebase/auth/use-profile';

interface NavbarSidebarProps {
  user: any;
  profile: any;
  canAccessManage: boolean;
  isRepartidor: boolean;
  onLogin: () => void;
  onLogout: () => void;
  showCodeLogin: boolean;
}

export function NavbarSidebar({ user, profile, canAccessManage, isRepartidor, onLogin, onLogout, showCodeLogin }: NavbarSidebarProps) {
  const { isAdmin } = useProfile();

  return (
    <nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10 hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5 text-slate-600" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0 border-none shadow-2xl">
          <div className="h-full flex flex-col">
            <div className="p-6 pb-2">
              <SheetHeader className="mb-4">
                <SheetTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <span className="text-2xl font-black italic tracking-tighter">yapido.click</span>
                </SheetTitle>
              </SheetHeader>
            </div>
            <ScrollArea className="flex-1 px-6">
              <SidebarNavigation user={user} canAccessManage={canAccessManage} isRepartidor={isRepartidor} isAdmin={isAdmin} />
            </ScrollArea>
            <div className="p-6 border-t border-slate-100">
              {user ? (
                <Button onClick={onLogout} variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold px-4">
                  <LogOut className="w-5 h-5" /> Cerrar Sesión
                </Button>
              ) : (
                <>
                  {showCodeLogin && (
                    <Button onClick={onLogin} className="w-full h-14 rounded-2xl bg-secondary font-black text-lg gap-3 shadow-xl mb-2">
                      <Key className="w-5 h-5" /> Ingresar con código
                    </Button>
                  )}
                  {!showCodeLogin && (
                    <span className="block text-center text-slate-400 text-[10px] font-black uppercase tracking-widest py-4">
                      Sesión automática al entrar
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
