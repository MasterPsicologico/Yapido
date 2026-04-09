
"use client";

import * as React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';

interface ActivityTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
}

export const ActivityTrigger = React.forwardRef<HTMLButtonElement, ActivityTriggerProps>(
  ({ count, className, onClick, ...props }, ref) => {
    const { user } = useUser();
    const auth = useAuth();

    const handleProtectedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!user) {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Acceso Restringido",
          description: "Tienes que estar autenticado para ver la actividad. Inicia sesión ahora.",
          action: (
            <button 
              onClick={() => initiateGoogleSignIn(auth)}
              className="bg-primary text-white px-3 py-1 rounded-md text-[10px] font-black uppercase"
            >
              INGRESAR
            </button>
          )
        });
        return;
      }
      onClick?.(e);
    };

    return (
      <Button 
        ref={ref}
        variant="ghost" 
        size="icon" 
        className={cn("relative rounded-full hover:bg-slate-100 transition-colors h-8 w-8 sm:h-9 sm:w-9", className)}
        onClick={handleProtectedClick}
        {...props}
      >
        <Bell className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", count > 0 ? "text-primary animate-vibrate" : "text-slate-400")} />
        {count > 0 && user && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {count}
          </span>
        )}
      </Button>
    );
  }
);

ActivityTrigger.displayName = "ActivityTrigger";
