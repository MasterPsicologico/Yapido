"use client";

import { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface ReportTimeConfigProps {
  store: any;
  onClose: () => void;
}

export function ReportTimeConfig({ store, onClose }: ReportTimeConfigProps) {
  const firestore = useFirestore();
  const [time, setTime] = useState(store?.reportTime || '19:00');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firestore || !store?.id) return;
    setIsSaving(true);
    try {
      const storeRef = doc(firestore, 'stores', store.id);
      updateDocumentNonBlocking(storeRef, { reportTime: time, updatedAt: serverTimestamp() });
      toast({ title: "Hora actualizada", description: `Informe programado a las ${time}` });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black text-slate-700">Hora del informe diario</p>
          <p className="text-[9px] font-bold text-slate-400">Se generará una alerta a esta hora</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="h-12 rounded-xl bg-slate-50 border-none font-black text-lg text-center flex-1"
        />
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="h-12 px-5 rounded-xl bg-primary font-black text-xs uppercase tracking-widest gap-2"
        >
          <Check className="w-4 h-4" /> Guardar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-12 w-12 rounded-xl text-slate-400 hover:bg-slate-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
