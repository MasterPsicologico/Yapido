
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store as StoreIcon, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface WasherStoreCreationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  isSending: boolean;
  onCreateStore: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function WasherStoreCreationDialog({
  isOpen,
  onOpenChange,
  profile,
  isSending,
  onCreateStore
}: WasherStoreCreationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[650] [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Inscribir Alquiler</DialogTitle>
          <DialogDescription>Formulario de registro para flota de lavadoras.</DialogDescription>
        </DialogHeader>
        <div className="h-20 bg-slate-900 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <StoreIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Mi Alquiler</h3>
              <p className="text-green-500/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Registro de Negocio</p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-6">
          <div className="max-w-md mx-auto py-10 space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi Alquiler</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configura tu flota y comienza a facturar</p>
            </div>
            <form onSubmit={onCreateStore} className="space-y-8">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre de la Tienda</Label><Input name="name" placeholder="Ej: Lavadoras El Sol" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp Comercial</Label><Input name="phone" defaultValue={profile?.phoneNumber || ''} placeholder="300 000 0000" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Dirección Base</Label><Input name="address" placeholder="Ubicación de tu flota" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Apertura</Label><Input name="openTime" type="time" defaultValue="08:00" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Cierre</Label><Input name="closeTime" type="time" defaultValue="20:00" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required /></div>
              </div>
              <Button type="submit" disabled={isSending} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl gap-4">
                {isSending ? <Loader2 className="animate-spin" /> : "GUARDAR Y LANZAR"}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
