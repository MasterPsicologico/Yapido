
"use client";

import { Tag, Zap, Clock, ShieldCheck, Truck, Award, Heart, Star, Utensils, Sparkles, Smartphone, Percent, Coffee, LucideIcon } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StatItem {
  iconName: string;
  label: string;
  color: string;
  textColor: string;
}

interface StoreStatsProps {
  stats?: StatItem[];
  isOwner?: boolean;
  storeId?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Tag, Zap, Clock, ShieldCheck, Truck, Award, Heart, Star, Utensils, Sparkles, Smartphone, Percent, Coffee
};

const STAT_OPTIONS = [
  { label: 'Promociones diarias', iconName: 'Tag', color: 'bg-[#fef3c7]', textColor: 'text-[#d97706]' },
  { label: 'Productos frescos', iconName: 'Zap', color: 'bg-[#ffedd5]', textColor: 'text-[#ea580c]' },
  { label: 'Domicilios rápidos', iconName: 'Clock', color: 'bg-[#ecfdf5]', textColor: 'text-[#059669]' },
  { label: 'Compra Segura', iconName: 'ShieldCheck', color: 'bg-[#e0f2fe]', textColor: 'text-[#0369a1]' },
  { label: 'Envío Gratis', iconName: 'Truck', color: 'bg-slate-100', textColor: 'text-slate-600' },
  { label: 'Calidad Premium', iconName: 'Award', color: 'bg-indigo-50', textColor: 'text-indigo-600' },
  { label: 'Hecho con Amor', iconName: 'Heart', color: 'bg-rose-50', textColor: 'text-rose-600' },
  { label: 'Top Ventas', iconName: 'Star', color: 'bg-yellow-50', textColor: 'text-yellow-600' },
  { label: 'Sabor Único', iconName: 'Utensils', color: 'bg-orange-50', textColor: 'text-orange-700' },
  { label: 'Innovación', iconName: 'Sparkles', color: 'bg-purple-50', textColor: 'text-purple-600' },
  { label: 'Atención 24/7', iconName: 'Smartphone', color: 'bg-green-50', textColor: 'text-green-700' },
  { label: 'Grandes Ofertas', iconName: 'Percent', color: 'bg-red-50', textColor: 'text-red-600' },
  { label: 'Café de Origen', iconName: 'Coffee', color: 'bg-amber-50', textColor: 'text-amber-800' },
];

export function StoreStats({ stats, isOwner, storeId }: StoreStatsProps) {
  const firestore = useFirestore();

  const currentStats = stats || [
    { label: 'Promociones diarias', iconName: 'Tag', color: 'bg-[#fef3c7]', textColor: 'text-[#d97706]' },
    { label: 'Productos frescos', iconName: 'Zap', color: 'bg-[#ffedd5]', textColor: 'text-[#ea580c]' },
    { label: 'Domicilios rápidos', iconName: 'Clock', color: 'bg-[#ecfdf5]', textColor: 'text-[#059669]' },
  ];

  const handleUpdateStat = (index: number, newStat: StatItem) => {
    if (!isOwner || !storeId || !firestore) return;
    
    const newStats = [...currentStats];
    newStats[index] = newStat;
    
    const storeRef = doc(firestore, 'stores', storeId);
    updateDocumentNonBlocking(storeRef, {
      customStats: newStats,
      updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {currentStats.map((stat, idx) => {
        const Icon = ICON_MAP[stat.iconName] || Tag;
        
        const content = (
          <div className={cn(
            "flex flex-col items-center gap-2 transition-transform active:scale-95",
            isOwner && "cursor-pointer hover:bg-slate-50 p-2 rounded-2xl"
          )}>
            <div className={cn("w-11 h-11 rounded-full flex items-center justify-center", stat.color)}>
              <Icon className={cn("w-5 h-5", stat.textColor)} />
            </div>
            <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1] break-words line-clamp-2 min-h-[2.2em] flex items-center justify-center">
              {stat.label}
            </span>
          </div>
        );

        if (!isOwner) return <div key={idx}>{content}</div>;

        return (
          <Popover key={idx}>
            <PopoverTrigger asChild>
              {content}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2 rounded-[24px] shadow-2xl border-none">
              <div className="p-3 border-b mb-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 italic">Personalizar Atributo</h4>
              </div>
              <ScrollArea className="h-72 pr-4">
                <div className="grid gap-2">
                  {STAT_OPTIONS.map((option, optIdx) => {
                    const OptIcon = ICON_MAP[option.iconName];
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleUpdateStat(idx, option)}
                        className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", option.color)}>
                          <OptIcon className={cn("w-4 h-4", option.textColor)} />
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 group-hover:text-primary transition-colors">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
