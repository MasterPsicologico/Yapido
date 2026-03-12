
"use client";

import Link from 'next/link';
import { Store, ShoppingBag, User, Search, Menu, Info, Home as HomeIcon, LogOut, ClipboardList, Truck, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/firebase/auth/use-profile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { user, isUserLoading } = useUser();
  const { profile } = useProfile();
  const auth = useAuth();

  const handleLogin = () => initiateGoogleSignIn(auth);
  const handleLogout = () => auth.signOut();

  const isRepartidor = profile?.role === 'repartidor';

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="mb-8">
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  Vitriniando
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4">
                <Link href="/" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                  <HomeIcon className="w-5 h-5 text-primary" />
                  Inicio
                </Link>
                <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                  <UserCircle className="w-5 h-5 text-primary" />
                  Mi Perfil
                </Link>
                <Link href="/about" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                  <Info className="w-5 h-5 text-primary" />
                  Sobre Nosotros
                </Link>
                {user && (
                  <>
                    <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      Gestionar Pedidos
                    </Link>
                    <Link href="/admin/manage" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                      <Store className="w-5 h-5 text-primary" />
                      Inventario y Tienda
                    </Link>
                    {isRepartidor ? (
                      <Link href="/delivery/dashboard" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                        <Truck className="w-5 h-5 text-secondary" />
                        Consola Delivery
                      </Link>
                    ) : (
                      <Link href="/delivery/register" className="flex items-center gap-3 px-4 py-2 text-lg font-medium hover:bg-muted rounded-lg transition-colors">
                        <Truck className="w-5 h-5 text-secondary" />
                        Quiero ser Repartidor
                      </Link>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary hidden sm:inline">Vitriniando</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md relative">
          <Input 
            placeholder="Buscar tiendas o productos..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-primary"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2">
          {!isUserLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/admin/orders">
                    <Button variant="ghost" className="hidden lg:flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Pedidos
                    </Button>
                  </Link>
                  {isRepartidor && (
                    <Link href="/delivery/dashboard">
                      <Button variant="secondary" className="hidden lg:flex items-center gap-2 bg-secondary/10 text-secondary border-none hover:bg-secondary/20 rounded-full h-9">
                        <Truck className="w-4 h-4" />
                        Delivery
                      </Button>
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-primary/20">
                          <AvatarImage src={profile?.photoURL || user.photoURL || ''} alt={user.displayName || ''} />
                          <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 rounded-[24px] shadow-2xl" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1 p-2">
                          <p className="text-sm font-black italic">{profile?.displayName || user.displayName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer">
                        <Link href="/profile">
                          <UserCircle className="mr-2 h-4 w-4 text-primary" />
                          <span className="font-bold">Mi Perfil Morrocoy</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer">
                        <Link href="/admin/orders">
                          <ClipboardList className="mr-2 h-4 w-4 text-primary" />
                          <span className="font-bold">Mis Pedidos</span>
                        </Link>
                      </DropdownMenuItem>
                      {isRepartidor && (
                        <DropdownMenuItem asChild className="rounded-xl h-11 cursor-pointer">
                          <Link href="/delivery/dashboard">
                            <Truck className="mr-2 h-4 w-4 text-secondary" />
                            <span className="font-bold text-secondary">Dashboard Delivery</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 rounded-xl h-11 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span className="font-bold">Cerrar Sesión</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button 
                  onClick={handleLogin}
                  variant="default" 
                  className="bg-secondary hover:bg-secondary/90 flex items-center gap-2 rounded-full px-6"
                >
                  <User className="w-4 h-4" />
                  <span>Ingresar</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
