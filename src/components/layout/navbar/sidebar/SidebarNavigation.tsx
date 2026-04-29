"use client";

import Link from 'next/link';
import { Home as HomeIcon, UserCircle, Info, ClipboardList, ShieldCheck, Waves, Briefcase, MapPinned } from 'lucide-react';
import { SheetClose } from "@/components/ui/sheet";
import { useRouter } from 'next/navigation';

interface SidebarNavigationProps {
  user: any;
  canAccessManage: boolean;
  isRepartidor: boolean;
  isAdmin?: boolean;
}

export function SidebarNavigation({ user, canAccessManage, isRepartidor, isAdmin }: SidebarNavigationProps) {
  const router = useRouter();
  const links = [
    { href: "/", label: "Inicio", icon: HomeIcon, color: "bg-blue-50 text-blue-500" },
    { href: "/profile", label: "Mi Perfil", icon: UserCircle, color: "bg-indigo-50 text-indigo-500" },
    { href: "/about", label: "Sobre Nosotros", icon: Info, color: "bg-cyan-50 text-cyan-500" },
  ];

  return (
    <nav className="flex flex-col gap-1.5 py-4 pb-10">
      {/* SECCIÓN ESTÁNDAR */}
      {links.map((link) => (
        <SheetClose key={link.href} asChild>
          <Link href={link.href} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${link.color} group-hover:bg-primary group-hover:text-white transition-colors`}>
              <link.icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700 group-hover:text-slate-900">{link.label}</span>
          </Link>
        </SheetClose>
      ))}

      {/* SECCIÓN DE GESTIÓN OPERATIVA */}
      {user && (
        <div className="mt-4 pt-4 border-t border-slate-50 space-y-1.5">
          {/* 1. GESTIONAR PEDIDOS */}
          <SheetClose asChild>
            <Link href="/admin/orders" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-50 text-orange-500 group-hover:bg-primary group-hover:text-white transition-colors">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-slate-900">Gestionar Pedidos</span>
            </Link>
          </SheetClose>

          {/* 2. PLAN DE NEGOCIOS (SOLO ADMIN - DEBAJO DE PEDIDOS) */}
          {isAdmin && (
            <SheetClose asChild>
              <Link href="/admin/business-plan" className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-slate-900 text-white shadow-2xl hover:bg-black transition-all group border-b-4 border-primary/20 animate-in fade-in zoom-in duration-500 my-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black italic uppercase tracking-tighter text-sm leading-none">Plan de Negocios</span>
                  <span className="text-[7px] font-bold text-primary uppercase tracking-[0.3em] mt-1">PROTOCOLO ELITE</span>
                </div>
              </Link>
            </SheetClose>
          )}

          {/* 3. CONSOLA DE MANDO (DUEÑOS O ADMIN) */}
          {canAccessManage && (
            <SheetClose asChild>
              <Link href="/admin/manage" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary animate-pulse group-hover:bg-primary group-hover:text-white transition-colors">
                  <Waves className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900">Consola de Mando</span>
              </Link>
            </SheetClose>
          )}

          {/* 4. VERIFICACIÓN DE FLOTA (SOLO ADMIN) */}
          {isAdmin && (
            <SheetClose asChild>
              <Link href="/admin/fleet" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-50 text-green-600 group-hover:bg-primary group-hover:text-white transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900">Verificación de Flota</span>
              </Link>
            </SheetClose>
          )}

          {/* 5. GESTIÓN GEOGRÁFICA (SOLO ADMIN) */}
          {isAdmin && (
            <SheetClose asChild>
              <Link href="/admin/geography" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-50 text-teal-600 group-hover:bg-primary group-hover:text-white transition-colors">
                  <MapPinned className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-700 group-hover:text-slate-900">Gestión Geográfica</span>
              </Link>
            </SheetClose>
          )}
        </div>
      )}
    </nav>
  );
}
