
"use client";

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollText } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

interface TermsSectionProps {
  acceptedTerms: boolean;
  onAcceptedChange: (val: boolean) => void;
  showTermsError: boolean;
}

export const TermsSection = React.forwardRef<HTMLDivElement, TermsSectionProps>(
  ({ acceptedTerms, onAcceptedChange, showTermsError }, ref) => {
    return (
      <div ref={ref} className="transition-all duration-500">
        <Card className={cn(
          "border-none shadow-2xl rounded-[48px] bg-white ring-1 transition-all duration-700 overflow-hidden",
          showTermsError ? "ring-4 ring-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-vibrate" : "ring-black/[0.03]"
        )}>
          <CardContent className="p-12">
            <div className={cn(
              "flex items-center gap-3 mb-8 font-black uppercase text-[11px] tracking-[0.3em] italic transition-colors",
              showTermsError ? "text-red-500" : "text-primary"
            )}>
              <ScrollText className="w-5 h-5" /> Compromiso de Operación
            </div>
            <div className="bg-slate-50/50 p-8 rounded-[36px] h-56 overflow-y-auto text-sm text-slate-500 leading-relaxed font-medium no-scrollbar border border-slate-100 shadow-inner mb-8">
              <p className="mb-5">1. <b className="text-slate-900">Edad y Documentación:</b> Debes ser mayor de edad y contar con documentos de identidad vigentes y originales.</p>
              <p className="mb-5">2. <b className="text-slate-900">Conducta Profesional:</b> El trato con clientes y comercios debe ser estrictamente profesional, puntual y respetuoso.</p>
              <p className="mb-5">3. <b className="text-slate-900">Comisiones:</b> La plataforma gestiona una tasa de servicio del 30% del valor del envío para mantenimiento del sistema.</p>
              <p className="mb-5">4. <b className="text-slate-900">Geolocalización:</b> Aceptas el rastreo GPS en tiempo real durante el transcurso de misiones activas para seguridad del pedido.</p>
              <p>5. <b className="text-slate-900">Sanciones:</b> La cuenta será bloqueada permanentemente ante reportes comprobados de fraude o incumplimiento de entrega.</p>
            </div>
            <div className={cn(
              "p-8 rounded-[32px] shadow-2xl flex items-center gap-5 transition-all duration-700",
              showTermsError ? "bg-red-600 scale-[1.03]" : "bg-slate-950 text-white"
            )}>
              <Checkbox 
                id="terms" 
                checked={acceptedTerms} 
                onCheckedChange={(v) => onAcceptedChange(!!v)} 
                className={cn(
                  "w-8 h-8 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-xl",
                  showTermsError && "ring-4 ring-white/30 animate-pulse"
                )} 
              />
              <label htmlFor="terms" className="text-[11px] font-black uppercase tracking-widest cursor-pointer leading-tight text-white/90">
                He leído y acepto el compromiso de servicio de Vitriniando
              </label>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

TermsSection.displayName = "TermsSection";
