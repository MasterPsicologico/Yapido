"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Importación de Funciones Atómicas (Mandamiento #1)
import { WasherSolicitationHeader } from './WasherSolicitationHeader';
import { WasherCustomerInfo } from './WasherCustomerInfo';
import { WasherTimeSelector } from './WasherTimeSelector';
import { WasherPaymentSelector } from './WasherPaymentSelector';
import { WasherSolicitationFooter } from './WasherSolicitationFooter';

interface WasherSolicitationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  profile: any;
  pricingConfig: any;
  isAnyStoreOpen: boolean;
  onOpenAdminSettings: () => void;
  onSubmitRequest: (data: any) => Promise<void>;
}

export function WasherSolicitationDialog({
  isOpen,
  onOpenChange,
  isAdmin,
  profile,
  pricingConfig,
  isAnyStoreOpen,
  onOpenAdminSettings,
  onSubmitRequest
}: WasherSolicitationDialogProps) {
  // Estados de Sincronización
  const [tempName, setTempName] = useState(profile?.displayName || "");
  const [tempAddress, setTempAddress] = useState(profile?.address || "");
  const [tempPhone, setTempPhone] = useState(profile?.phoneNumber || "");
  const [requestHours, setRequestHours] = useState(Number(pricingConfig?.minHours || 5));
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  const [isSending, setIsSending] = useState(false);
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');

  // Lógica Financiera
  const minHours = Number(pricingConfig?.minHours || 5);
  const valHoraBase = Number(pricingConfig?.basePrice || 3000);
  const totalPrice = requestHours * valHoraBase;

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(totalPrice);

  const handleAdjustHours = (delta: number) => {
    const newHours = requestHours + delta;
    if (newHours < minHours) {
      setFlashEffect('red');
      setTimeout(() => setFlashEffect('none'), 600);
      return;
    }
    setFlashEffect('green');
    setRequestHours(newHours);
    setTimeout(() => setFlashEffect('none'), 600);
  };

  const handleFormSubmit = async () => {
    setIsSending(true);
    await onSubmitRequest({
      customerName: tempName,
      customerAddress: tempAddress,
      customerPhone: tempPhone,
      requestHours,
      totalPrice,
      paymentMethod
    });
    setIsSending(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
          <DialogDescription>Formulario de solicitud express para alquiler de lavadoras.</DialogDescription>
        </DialogHeader>
        
        {/* Función 1: Header */}
        <WasherSolicitationHeader 
          isAdmin={isAdmin} 
          onOpenAdminSettings={onOpenAdminSettings} 
          onClose={() => onOpenChange(false)} 
        />

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-8 px-6 space-y-6">
            
            {/* Función 2: Información del Cliente */}
            <WasherCustomerInfo 
              name={tempName} onNameChange={setTempName}
              address={tempAddress} onAddressChange={setTempAddress}
              phone={tempPhone} onPhoneChange={setTempPhone}
            />

            {/* Función 3: Selector de Tiempo */}
            <WasherTimeSelector 
              requestHours={requestHours}
              onAdjustHours={handleAdjustHours}
              minHours={minHours}
              formattedPrice={formattedPrice}
              flashEffect={flashEffect}
            />

            {/* Función 4: Selector de Pago */}
            <WasherPaymentSelector 
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
            />

            {/* Función 5: Footer y Envío */}
            <WasherSolicitationFooter 
              formattedPrice={formattedPrice}
              paymentMethod={paymentMethod}
              isSending={isSending}
              isAnyStoreOpen={isAnyStoreOpen}
              onSubmit={handleFormSubmit}
            />
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
