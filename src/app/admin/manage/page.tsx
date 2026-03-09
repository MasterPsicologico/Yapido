
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AIDescriptionButton } from '@/components/product/AIDescriptionButton';
import { Plus, Trash2, Save, Store as StoreIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ManagePage() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState<string[]>([""]);
  
  const handleAddFeature = () => setFeatures([...features, ""]);
  const handleRemoveFeature = (index: number) => {
    const newFeatures = features.filter((_, i) => i !== index);
    setFeatures(newFeatures.length ? newFeatures : [""]);
  };
  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = value;
    setFeatures(newFeatures);
  };

  const handleSave = () => {
    toast({
      title: "Guardado",
      description: "Producto guardado correctamente en tu vitrina.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white">
            <StoreIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Panel de Gestión</h1>
            <p className="text-muted-foreground">Agrega o edita los productos de tu tienda.</p>
          </div>
        </div>

        <div className="grid gap-8">
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Información del Producto</CardTitle>
              <CardDescription>Completa los detalles básicos para tu vitrina.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Producto</Label>
                <Input 
                  id="name" 
                  placeholder="Ej: Croissant de Almendras" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Características Clave</Label>
                  <Button variant="ghost" size="sm" onClick={handleAddFeature} className="text-primary gap-1">
                    <Plus className="w-4 h-4" /> Añadir característica
                  </Button>
                </div>
                {features.map((feature, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input 
                      placeholder="Ej: Sin conservantes" 
                      value={feature}
                      onChange={(e) => handleFeatureChange(idx, e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFeature(idx)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descripción del Producto</Label>
                  <AIDescriptionButton 
                    productName={productName} 
                    keyFeatures={features.filter(f => f.trim() !== "")}
                    onGenerated={(desc) => setDescription(desc)}
                  />
                </div>
                <Textarea 
                  id="description" 
                  placeholder="Escribe una descripción o usa la IA para generarla..." 
                  className="min-h-[150px] leading-relaxed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  * La IA utiliza el nombre y las características para crear un texto optimizado para ventas.
                </p>
              </div>

              <div className="pt-6">
                <Button onClick={handleSave} className="w-full h-14 text-lg font-bold gap-2 bg-secondary hover:bg-secondary/90">
                  <Save className="w-5 h-5" /> Guardar Producto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
