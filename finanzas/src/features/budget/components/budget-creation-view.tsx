
"use client"

import React, { useState } from 'react';
import { 
  X, 
  Home, 
  Car, 
  Utensils, 
  HeartPulse, 
  Coffee, 
  Landmark, 
  Check,
  Sparkles,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const presets = [
  { name: 'vivienda', icon: <Home className="w-5 h-5" />, type: 'gasto' },
  { name: 'trabajo', icon: <Landmark className="w-5 h-5" />, type: 'ingreso' },
  { name: 'alimentación', icon: <Utensils className="w-5 h-5" />, type: 'gasto' },
  { name: 'vehículo', icon: <Car className="w-5 h-5" />, type: 'gasto' },
  { name: 'salud', icon: <HeartPulse className="w-5 h-5" />, type: 'gasto' },
  { name: 'ocio', icon: <Coffee className="w-5 h-5" />, type: 'gasto' },
];

const formatWithPoints = (val: string) => {
  const nums = val.replace(/\D/g, '');
  return nums.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface BudgetCreationViewProps {
  onClose: () => void;
  onConfirm: (name: string, limit: number, type: 'gasto' | 'ingreso') => void;
  currencySymbol: string;
}

export function BudgetCreationView({ onClose, onConfirm, currencySymbol }: BudgetCreationViewProps) {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [type, setType] = useState<'gasto' | 'ingreso'>('gasto');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = (p: any) => {
    setSelectedPreset(p.name);
    setName(p.name);
    setType(p.type);
  };

  const handleFinish = () => {
    if (!name.trim()) return;
    onConfirm(name, parseFloat(limit.replace(/\./g, '')) || 0, type);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-white flex flex-col animate-in slide-in-from-bottom duration-400 rounded-none overflow-hidden">
      <div className="bg-[#293462] text-white p-8 pt-12 shrink-0">
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">ARQUITECTURA DE META</h2>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-white/30 hover:text-white transition-all rounded-full"><X className="w-7 h-7" /></button>
        </div>
        
        <div className="space-y-6">
          <div className="flex bg-white/10 p-1 rounded-xl">
            <button 
              onClick={() => setType('gasto')}
              className={cn("flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", type === 'gasto' ? "bg-white text-primary" : "text-white/50")}
            >
              <TrendingDown className="w-3 h-3" /> Gasto
            </button>
            <button 
              onClick={() => setType('ingreso')}
              className={cn("flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", type === 'ingreso' ? "bg-green-500 text-white" : "text-white/50")}
            >
              <TrendingUp className="w-3 h-3" /> Ingreso
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <p className="text-[8px] font-black text-white/30 uppercase mb-2 ml-1">Identidad de la Meta</p>
              <Input placeholder="Ej: Trabajo Freelance..." value={name} onChange={(e) => setName(e.target.value)} className="h-14 bg-white border-none text-xl font-black text-primary px-4" />
            </div>
            <div className="relative">
              <p className="text-[8px] font-black text-accent/50 uppercase mb-2 ml-1">{type === 'ingreso' ? 'Objetivo de Ganancia' : 'Presupuesto Límite'}</p>
              <div className="flex items-center bg-white px-4 border-b border-white/10">
                <span className="text-2xl font-black text-primary/20">{currencySymbol}</span>
                <Input 
                  type="text" 
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0" 
                  value={limit} 
                  onChange={(e) => setLimit(formatWithPoints(e.target.value))} 
                  className="h-14 bg-transparent border-none text-2xl font-black text-primary" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 bg-white">
        <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 px-2">Sugerencias Inteligentes</h3>
        <div className="grid grid-cols-2 gap-3 pb-10">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => handlePresetSelect(p)}
              className={cn(
                "flex items-center p-4 gap-4 transition-all border",
                selectedPreset === p.name ? "bg-primary border-primary text-white shadow-xl" : "bg-white border-muted/30 text-primary hover:border-accent"
              )}
            >
              <div className={cn("p-2.5 rounded-lg", selectedPreset === p.name ? "bg-white/20" : "bg-muted/10")}>{p.icon}</div>
              <span className="text-[9px] font-black uppercase truncate">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white border-t shrink-0">
        <Button onClick={handleFinish} disabled={!name.trim()} className="w-full h-16 bg-accent text-white font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 rounded-none">
          <Check className="w-4 h-4 stroke-[3px]" /> Confirmar Meta Maestro
        </Button>
      </div>
    </div>
  );
}
