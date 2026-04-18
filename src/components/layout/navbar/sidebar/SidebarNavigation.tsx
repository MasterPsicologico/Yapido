"use client";

import Link from 'next/link';
import { Home as HomeIcon, UserCircle, Info, ClipboardList, ShieldCheck, Waves, Briefcase } from 'lucide-react';
import { SheetClose } from "@/components/ui/sheet";

interface SidebarNavigationProps {
  user: any;
  canAccessManage: boolean;
  isRepartidor: boolean;
  isAdmin?: boolean;
}

export function SidebarNavigation({ user, canAccessManage, isRepartidor, isAdmin }: SidebarNavigationProps) {
  const links = [
    { href: "/", label: "Inicio", icon: HomeIcon, color: "bg-blue-50 text-blue-500" },
    { href: "/profile", label: "Mi Perfil", icon: UserCircle, color: "bg-indigo-50 text-indigo-500" },
    { href: "/about", label: "Sobre Nosotros", icon: Info, color: "bg-cyan-50 text-cyan-500" },
  ];

  const adminLinks = [
    { href: "/admin/orders", label: "Gestionar Pedidos", icon: ClipboardList, color: "bg-orange-50 text-orange-500" },
    ...(canAccessManage ? [{ href: "/admin/manage", label: "Consola de Mando", icon: Waves, color: "bg-primary/10 text-primary animate-pulse" }] : []),
    ...(isAdmin ? [{ href: "/admin/fleet", label: "Verificación de Flota", icon: ShieldCheck, color: "bg-green-50 text-green-600" }] : []),
  ];

  return (
    <nav className="flex flex-col gap-1.5 py-4 pb-10">
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

      {user && adminLinks.map((link) => (
        <SheetClose key={link.href} asChild>
          <Link href={link.href} className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:bg-slate-50 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${link.color} group-hover:bg-primary group-hover:text-white transition-colors`}>
              <link.icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-slate-700 group-hover:text-slate-900">{link.label}</span>
          </Link>
        </SheetClose>
      ))}

      {/* TERMINAL DE ESTRATEGIA: ESTRICTAMENTE EXCLUSIVA PARA EL ADMINISTRADOR PRINCIPAL */}
      {isAdmin && (
        <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4">Inteligencia de Mando</p>
          <SheetClose asChild>
            <Link href="/admin/business-plan" className="flex items-center gap-4 px-4 py-4 rounded-3xl bg-slate-900 text-white shadow-2xl hover:bg-black transition-all group border-b-4 border-primary/20">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black italic uppercase tracking-tighter text-sm">Mi Plan de Negocios</span>
                <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Protocolo Millonario</span>
              </div>
            </Link>
          </SheetClose>
        </div>
      )}
    </nav>
  );
}
