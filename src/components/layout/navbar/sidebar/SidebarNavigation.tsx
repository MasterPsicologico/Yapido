
"use client";

import Link from 'next/link';
import { Home as HomeIcon, UserCircle, Info, ClipboardList, Store, Truck } from 'lucide-react';
import { SheetClose } from "@/components/ui/sheet";

interface SidebarNavigationProps {
  user: any;
  canAccessManage: boolean;
  isRepartidor: boolean;
}

export function SidebarNavigation({ user, canAccessManage, isRepartidor }: SidebarNavigationProps) {
  const links = [
    { href: "/", label: "Inicio", icon: HomeIcon, color: "bg-blue-50 text-blue-500" },
    { href: "/profile", label: "Mi Perfil", icon: UserCircle, color: "bg-indigo-50 text-indigo-500" },
    { href: "/about", label: "Sobre Nosotros", icon: Info, color: "bg-cyan-50 text-cyan-500" },
  ];

  const adminLinks = [
    { href: "/admin/orders", label: "Gestionar Pedidos", icon: ClipboardList, color: "bg-orange-50 text-orange-500" },
    ...(canAccessManage ? [{ href: "/admin/manage", label: "Inventario y Tienda", icon: Store, color: "bg-violet-50 text-violet-500" }] : []),
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
  );
}
