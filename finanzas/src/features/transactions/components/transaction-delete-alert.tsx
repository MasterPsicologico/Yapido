
"use client"

import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface TransactionDeleteAlertProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function TransactionDeleteAlert({ onClose, onConfirm }: TransactionDeleteAlertProps) {
  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-none border-none shadow-2xl p-10 bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-black uppercase text-primary tracking-widest text-xl">¿Confirmar Eliminación?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm font-medium mt-4 leading-relaxed">
            Esta acción eliminará permanentemente la transacción de su historial.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-4 mt-10">
          <AlertDialogAction 
            className="w-full h-16 rounded-none bg-destructive text-white font-black uppercase text-xs shadow-xl active:scale-95" 
            onClick={onConfirm}
          >
            Sí, Borrar Definitivamente
          </AlertDialogAction>
          <AlertDialogCancel className="w-full h-16 rounded-none font-black bg-muted/50 border-none uppercase text-xs">
            Mantener Registro
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
