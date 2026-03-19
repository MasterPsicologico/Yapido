
"use client";

import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface RatingDialogProps {
  orderId: string;
  storeName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RatingDialog({ orderId, storeName, isOpen, onOpenChange }: RatingDialogProps) {
  const firestore = useFirestore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Selecciona una puntuación", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      updateDocumentNonBlocking(orderRef, {
        rating,
        review,
        ratedAt: serverTimestamp()
      });
      
      toast({ 
        title: "¡Gracias por tu opinión!", 
        description: "Tu reseña ayuda a la comunidad de Vitriniando.",
        className: "bg-green-600 text-white border-none"
      });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error al enviar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px]">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-yellow-600" />
          </div>
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
            ¿Cómo estuvo tu pedido?
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-medium">
            Califica tu experiencia en <b>{storeName}</b>
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="transition-transform active:scale-90"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                <Star 
                  className={cn(
                    "w-10 h-10 transition-colors",
                    (hoverRating || rating) >= star 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-slate-200"
                  )} 
                />
              </button>
            ))}
          </div>

          <div className="w-full space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Tu Comentario (Opcional)</p>
            <Textarea 
              placeholder="Escribe algo sobre la calidad, el empaque o la velocidad..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[100px] rounded-2xl bg-slate-50 border-none resize-none focus:ring-2 focus:ring-yellow-400/20"
            />
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || rating === 0}
            className="w-full h-14 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest gap-3 shadow-xl"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : "ENVIAR CALIFICACIÓN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
