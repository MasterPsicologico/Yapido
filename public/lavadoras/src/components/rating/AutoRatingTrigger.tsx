
"use client";

import { useAutoRating } from '@/hooks/use-auto-rating';
import { RatingDialog } from '@/components/order/RatingDialog';

/**
 * Componente invisible que se monta globalmente.
 * Detecta órdenes completadas sin calificar y dispara el RatingDialog automáticamente.
 */
export function AutoRatingTrigger() {
  const { orderToRate, showRating, setShowRating, ratingType } = useAutoRating();

  if (!orderToRate) return null;

  return (
    <RatingDialog
      orderId={orderToRate.id}
      storeName={orderToRate.storeName || 'Servicio'}
      isOpen={showRating}
      onOpenChange={setShowRating}
      ratingType={ratingType}
    />
  );
}
