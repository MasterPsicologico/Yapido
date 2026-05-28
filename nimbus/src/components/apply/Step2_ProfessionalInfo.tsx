'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';

export default function Step2_ProfessionalInfo() {
  const { control } = useFormContext();
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="credentials"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="credentials">Credenciales</Label>
            <FormControl>
              <Input id="credentials" {...field} placeholder="Ej: Lic. en Psicología, Mat. 12345" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <Label htmlFor="bio">Biografía Profesional</Label>
            <FormControl>
              <Textarea id="bio" {...field} rows={5} placeholder="Cuéntanos sobre ti, tu enfoque y experiencia..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
