
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  ShoppingBag, 
  User, 
  Search, 
  Menu, 
  Info, 
  Home as HomeIcon, 
  LogOut, 
  ClipboardList, 
  Truck, 
  UserCircle, 
  Bell, 
  MessageSquareText,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/firebase/auth/use-profile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActivityCenter } from './ActivityCenter';
import { MessageCenter } from './MessageCenter';
import { Progress } from "@/components/ui/progress";
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const { profile, isOwner, isAdmin } = useProfile();
  const auth = useAuth();
  const router = useRouter();

  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDeliveryRedirect = () => {
    setIsDeliveryLoading(true);
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          router.push('/delivery/dashboard');
          setIsDeliveryLoading(false);
          setProgress(0);
        }, 300);
      }
    }, 100);
  };

  const handleLogin = () => initiateGoogleSignIn(auth);
  const handleLogout = () => auth.signOut();

  const isRepartidor = profile?.role === 'repartidor';
  const canAccessManage = isOwner || isAdmin || profile?.role === 'dueño';

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <SheetHeader className="mb-8">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white"><ShoppingBag className="w-5 h-5" /></div>
                  Vitriniando
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-3 px-4 py-2 font-bold hover:bg-muted rounded-lg transition-colors"><HomeIcon className="w-5 h-5 text-primary" /> Inicio</Link>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-2 font-bold hover:bg-muted rounded-lg transition-colors"><UserCircle className="w-5 h-5 text-primary" /> Perfil</Link>
                {user && (
                  <>
                    <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-2 font-bold hover:bg-muted rounded-lg transition-colors"><ClipboardList className="w-5 h-5 text-primary" /> Pedidos</Link>
                    {canAccessManage && <Link href="/admin/manage" className="flex items-center gap-3 px-4 py-2 font-bold hover:bg-muted rounded-lg transition-colors"><Store className="w-5 h-5 text-primary" /> Mi Negocio</Link>}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform"><ShoppingBag className="w-6 h-6" /></div>
            <span className="text-2xl font-black tracking-tight text-primary hidden sm:inline italic">Vitriniando</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isUserLoading && user && (
            <>
              {/* Botón Delivery Inteligente */}
              <div className="relative flex items-center group overflow-hidden h-10 rounded-full transition-all duration-500 ease-in-out cursor-pointer bg-secondary/10 hover:bg-secondary/20 pr-4 pl-1" onClick={handleDeliveryRedirect}>
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-black shadow-lg">D</div>
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-secondary opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">Delivery</span>
                {isDeliveryLoading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-secondary transition-all duration-100" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              <ActivityCenter />
              <MessageCenter />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
                      <AvatarFallback className="font-black">U</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2 rounded-[24px] shadow-2xl" align="end">
                  <DropdownMenuLabel className="font-normal p-4">
                    <p className="text-sm font-black italic">{profile?.displayName || user.displayName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-xl h-11"><Link href="/profile"><UserCircle className="mr-2 h-4 w-4 text-primary" /><span className="font-bold">Mi Perfil</span></Link></DropdownMenuItem>
                  {canAccessManage && <DropdownMenuItem asChild className="rounded-xl h-11"><Link href="/admin/manage"><Store className="mr-2 h-4 w-4 text-primary" /><span className="font-bold">Gestionar Mi Negocio</span></Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 rounded-xl h-11"><LogOut className="mr-2 h-4 w-4" /><span className="font-bold">Cerrar Sesión</span></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!isUserLoading && !user && (
            <Button onClick={handleLogin} variant="default" className="bg-secondary hover:bg-secondary/90 flex items-center gap-2 rounded-full px-6 font-black">
              <User className="w-4 h-4" /> Ingresar
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
