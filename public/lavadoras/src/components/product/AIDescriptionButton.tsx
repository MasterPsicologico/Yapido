
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { toast } from '@/hooks/use-toast';

interface AIDescriptionButtonProps {
  productName: string;
  keyFeatures: string[];
  onGenerated: (description: string) => void;
}

export function AIDescriptionButton({ productName, keyFeatures, onGenerated }: AIDescriptionButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!productName) {
      toast({
        title: "Falta información",
        description: "Por favor, ingresa el nombre del producto primero.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await generateProductDescription({
        productName,
        keyFeatures
      });
      onGenerated(result.generatedDescription);
      toast({
        title: "¡Generado con éxito!",
        description: "Hemos creado una descripción profesional para tu producto.",
      });
    } catch (error) {
      toast({
        title: "Error al generar",
        description: "Hubo un problema con la IA. Por favor intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading}
      type="button"
      className="bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white rounded-full transition-all gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      Generar con IA
    </Button>
  );
}
