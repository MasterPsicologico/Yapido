'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage, FormDescription } from '@/components/ui/form';

export default function Step3_Details() {
  const { control } = useFormContext();
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="specialties"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="specialties">Especialidades</Label>
            <FormControl>
              <Input id="specialties" {...field} placeholder="Ansiedad, Depresión, Terapia de Pareja" />
            </FormControl>
            <FormDescription>Separa las especialidades por comas.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="languages"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="languages">Idiomas</Label>
            <FormControl>
              <Input id="languages" {...field} placeholder="Español, Inglés" />
            </FormControl>
            <FormDescription>Separa los idiomas por comas.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="pricePerSession"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="pricePerSession">Precio por Sesión (USD)</Label>
            <FormControl>
              <Input id="pricePerSession" type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
