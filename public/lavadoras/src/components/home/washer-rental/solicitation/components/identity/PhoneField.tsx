"use client";

import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PhoneFieldProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  saveStatus?: 'idle' | 'typing' | 'saved';
  hasError?: boolean;
}

export const PhoneField = React.memo(React.forwardRef<HTMLDivElement, PhoneFieldProps>(
  ({ value, onChange, onBlur, saveStatus, hasError }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2 group transition-all duration-300", hasError && "animate-shake-strong")}>
        <div className="flex items-center gap-2 ml-4">
          <Sparkles className={cn("w-3 h-3 animate-pulse", hasError ? "text-red-500" : "text-yellow-600")} />
          <Label className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
            hasError ? "text-red-500" : "text-slate-400"
          )}>
            WhatsApp Directo
          </Label>
        </div>
        <div className="relative overflow-hidden rounded-[24px]">
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
          
          <div className={cn(
            "absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-slate-900 shadow-md z-10 transition-colors",
            hasError ? "bg-red-500" : "bg-gradient-to-br from-yellow-400 to-yellow-600"
          )}>
            <Zap className="w-5 h-5 fill-slate-900" />
          </div>
          
          <Input 
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            onBlur={onBlur}
            className={cn(
              "h-14 sm:h-14 lg:h-16 rounded-[20px] sm:rounded-[24px] border-2 pl-12 sm:pl-14 lg:pl-16 pr-12 font-black text-base sm:text-lg transition-all duration-500",
              "bg-gradient-to-r from-yellow-50/50 to-white focus:bg-white",
              hasError 
                ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" 
                : "border-yellow-500/20 focus:border-yellow-500 focus:shadow-[0_0_25px_rgba(234,179,8,0.2)]"
            )}
            placeholder="Número de contacto..." 
          />
        </div>
      </div>
    );
  }
));

PhoneField.displayName = "PhoneField";
