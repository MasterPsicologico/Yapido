
"use client";

import { Store as StoreIcon, X, Send, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoreWhatsAppChatProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storeName?: string;
  storeImageUrl?: string;
}

export function StoreWhatsAppChat({ isOpen, onOpenChange, storeName, storeImageUrl }: StoreWhatsAppChatProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-none overflow-hidden max-w-[380px] rounded-[32px]">
         <DialogHeader className="sr-only">
            <DialogTitle>Chat con {storeName}</DialogTitle>
            <DialogDescription>Habla directamente con el negocio.</DialogDescription>
         </DialogHeader>
         <div className="bg-[#075e54] p-4 flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-white/20">
               <AvatarImage src={storeImageUrl} />
               <AvatarFallback className="bg-white/10 text-white"><StoreIcon className="w-5 h-5" /></AvatarFallback>
            </Avatar>
            <div>
               <h4 className="text-white font-bold text-sm leading-none mb-1">{storeName}</h4>
               <p className="text-white/70 text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> en línea
               </p>
            </div>
            <Button variant="ghost" size="icon" className="ml-auto text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
               <X className="w-4 h-4" />
            </Button>
         </div>
         <div className="bg-[#e5ddd5] h-[400px] p-4 space-y-4 overflow-y-auto relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://i.pinimg.com/originals/8a/3b/b1/8a3bb1356784013110294e09f583f773.jpg')] bg-repeat" />
            <div className="relative bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
               <p className="text-xs font-medium text-slate-800">
                  ¡Hola! 👋 Gracias por contactar a <b>{storeName}</b>. 
               </p>
               <span className="text-[9px] text-slate-400 block text-right mt-1">10:00 AM</span>
            </div>
         </div>
         <div className="bg-white p-4 flex items-center gap-3 border-t">
            <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 flex items-center justify-between">
               <span className="text-slate-400 text-sm">Escribe un mensaje...</span>
               <Tag className="w-4 h-4 text-slate-400 rotate-90" />
            </div>
            <Button size="icon" className="bg-[#075e54] hover:bg-[#128c7e] rounded-full h-10 w-10">
               <Send className="w-4 h-4 text-white fill-white" />
            </Button>
         </div>
      </DialogContent>
    </Dialog>
  );
}
