
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Store, 
  ShoppingBag, 
  User, 
  Menu, 
  Info, 
  Home as HomeIcon, 
  LogOut, 
  ClipboardList, 
  Truck, 
  UserCircle, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/firebase/auth/use-profile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActivityCenter } from './ActivityCenter';
import { MessageCenter } from './MessageCenter';
import { cn } from '@/lib/utils';

const MODE_KEY = 'vitriniando_preferred_mode';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const { profile, isOwner, isAdmin } = useProfile();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);

  const isDeliveryZone = pathname?.startsWith('/delivery');
  const targetLabel = isDeliveryZone ? "TIENDAS" : "DELIVERY";
  const targetIcon = isDeliveryZone ? "T" : "D";

  const handleModeSwitch = () => {
    setIsTransitioning(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          const nextMode = isDeliveryZone ? 'stores' : 'delivery';
          const nextPath = isDeliveryZone ? '/' : '/delivery/dashboard';
          
          localStorage.setItem(MODE_KEY, nextMode);
          router.push(nextPath);
          
          setIsTransitioning(false);
          setProgress(0);
        }, 200);
      }
    }, 30);
  };

  const handleLogin = () => initiateGoogleSignIn(auth);
  const handleLogout = () => {
    localStorage.removeItem(MODE_KEY);
    auth.signOut();
  };

  const isRepartidor = profile?.role === 'repartidor';
  const canAccessManage = isOwner || isAdmin || profile?.role === 'dueño';

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-slate-100 overflow-hidden">
      <div className="max-w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        
        {/* LADO IZQUIERDO: Menú y Marca */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-slate-50">
                <Menu className="w-5 h-5 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 border-none shadow-2xl">
              <div className="p-6 h-full flex flex-col">
                <SheetHeader className="mb-8">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black italic tracking-tighter">Vitriniando</span>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1.5">
                  <SheetClose asChild>
                    <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-500 group-hover:bg-primary group-hover:text-white transition-colors">
                        <HomeIcon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900">Inicio</span>
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link href="/profile" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-500 group-hover:bg-primary group-hover:text-white transition-colors">
                        <UserCircle className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900">Mi Perfil</span>
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link href="/about" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-50 text-cyan-500 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Info className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900">Sobre Nosotros</span>
                    </Link>
                  </SheetClose>

                  {user && (
                    <>
                      <SheetClose asChild>
                        <Link href="/admin/orders" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-50 text-orange-500 group-hover:bg-primary group-hover:text-white transition-colors">
                            <ClipboardList className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-700 group-hover:text-slate-900">Gestionar Pedidos</span>
                        </Link>
                      </SheetClose>

                      {canAccessManage && (
                        <SheetClose asChild>
                          <Link href="/admin/manage" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-50 text-violet-500 group-hover:bg-primary group-hover:text-white transition-colors">
                              <Store className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-700 group-hover:text-slate-900">Inventario y Tienda</span>
                          </Link>
                        </SheetClose>
                      )}
                    </>
                  )}

                  {!isRepartidor && (
                    <SheetClose asChild>
                      <Link href="/delivery/register" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-500 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Truck className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-slate-900">Quiero ser Repartidor</span>
                      </Link>
                    </SheetClose>
                  )}
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  {user ? (
                    <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-4 h-14 rounded-2xl text-red-500 hover:bg-red-50 hover:text-red-600 font-bold px-4">
                      <LogOut className="w-5 h-5" /> Cerrar Sesión
                    </Button>
                  ) : (
                    <Button onClick={handleLogin} className="w-full h-14 rounded-2xl bg-secondary font-black text-lg gap-3 shadow-xl shadow-secondary/20">
                      <User className="w-5 h-5" /> Ingresar Ahora
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-lg shadow-primary/20 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-primary hidden lg:inline italic uppercase leading-none">Vitriniando</span>
          </Link>
        </div>

        {/* LADO DERECHO: Acciones Agrupadas (Sin desbordamiento) */}
        <div className="flex items-center gap-1 sm:gap-3 ml-auto">
          {!isUserLoading && user && (
            <>
              {/* Botón de Modo: Más compacto en móvil */}
              <div 
                className={cn(
                  "relative flex items-center h-10 rounded-full cursor-pointer transition-all duration-300 pr-3 sm:pr-4 pl-1 overflow-hidden min-w-[90px] sm:min-w-[110px]",
                  isDeliveryZone ? "bg-primary/10 hover:bg-primary/20" : "bg-secondary/10 hover:bg-secondary/20"
                )}
                onClick={handleModeSwitch}
              >
                {isTransitioning && (
                  <div 
                    className={cn(
                      "absolute inset-0 transition-all duration-100 ease-linear opacity-40",
                      isDeliveryZone ? "bg-primary" : "bg-secondary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                )}

                <div className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white font-black shadow-lg transition-transform text-xs",
                  isDeliveryZone ? "bg-primary" : "bg-secondary",
                  isTransitioning && "scale-90"
                )}>
                  {isTransitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : targetIcon}
                </div>
                
                <span className={cn(
                  "relative z-10 ml-1.5 sm:ml-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-colors truncate",
                  isDeliveryZone ? "text-primary" : "text-secondary"
                )}>
                  {targetLabel}
                </span>
              </div>

              {/* Cápsula de Cristal para Iconos de Sistema */}
              <div className="hidden xs:flex items-center bg-slate-50/80 rounded-full px-1.5 py-1 gap-0.5 border border-slate-100 backdrop-blur-sm">
                <ActivityCenter />
                <MessageCenter />
              </div>

              {/* Dropdown de Perfil: Rediseñado y blindado contra desbordamiento */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 shrink-0 border-2 border-primary/10 hover:border-primary/40 transition-colors bg-white">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
                      <AvatarFallback className="font-black text-[10px] bg-slate-50 text-primary">U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 rounded-[24px] shadow-2xl mr-2" align="end">
                  <DropdownMenuLabel className="font-normal p-4">
                    <p className="text-sm font-black italic">{profile?.displayName || user.displayName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer">
                    <Link href="/profile" className="flex items-center">
                      <UserCircle className="mr-2 h-4 w-4 text-primary" />
                      <span className="font-bold">Mi Perfil</span>
                    </Link>
                  </DropdownMenuItem>
                  {canAccessManage && (
                    <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer">
                      <Link href="/admin/manage" className="flex items-center">
                        <Store className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-bold">Gestionar Mi Negocio</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 rounded-xl h-11 cursor-pointer hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="font-bold">Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isUserLoading && !user && (
            <Button onClick={handleLogin} variant="default" className="bg-secondary hover:bg-secondary/90 flex items-center gap-2 rounded-full px-4 sm:px-6 font-black shadow-lg shadow-secondary/20 h-10 text-xs">
              <User className="w-4 h-4" /> <span className="hidden xs:inline">Ingresar</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
