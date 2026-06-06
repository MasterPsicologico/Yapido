"use client";

import { User as UserIcon, MapPin, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WasherCustomerInfoProps {
  name: string;
  onNameChange: (v: string) => void;
  address: string;
  onAddressChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
}

export function WasherCustomerInfo({
  name, onNameChange, address, onAddressChange, phone, onPhoneChange
}: WasherCustomerInfoProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">NOMBRE COMPLETO</Label>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
            <UserIcon className="w-4 h-4" />
          </div>
          <Input 
            value={name} 
            onChange={(e) => onNameChange(e.target.value)} 
            className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" 
            placeholder="Escribe tu nombre..." 
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">DIRECCIÓN DE ENTREGA</Label>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
            <MapPin className="w-4 h-4" />
          </div>
          <Input 
            value={address} 
            onChange={(e) => onAddressChange(e.target.value)} 
            className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" 
            placeholder="Calle, Barrio, Casa..." 
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">WHATSAPP</Label>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-green-500 transition-colors">
            <Zap className="w-4 h-4" />
          </div>
          <Input 
            value={phone} 
            onChange={(e) => onPhoneChange(e.target.value)} 
            className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" 
            placeholder="300 000 0000" 
          />
        </div>
      </div>
    </div>
  );
}
