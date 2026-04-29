
"use client";

import * as React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';

interface CartTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  totalItems: number;
}

export const CartTrigger = React.forwardRef<HTMLButtonElement, CartTriggerProps>(
  ({ totalItems, className, onClick, ...props }, ref) => {
    const { user } = useUser();
    const auth = useAuth();

    const handleProtectedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!user) {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Carrito Protegido",
          description: "Tienes que estar autenticado para ver tu carrito de pedidos.",
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
        <ShoppingCart className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", (totalItems > 0 && user) ? "text-primary" : "text-slate-400")} />
        {totalItems > 0 && user && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[7px] sm:text-[8px] font-black w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] flex items-center justify-center border-[1.5px] border-white shadow-sm ring-1 ring-primary/20">
            {totalItems}
          </span>
        )}
      </Button>
    );
  }
);

CartTrigger.displayName = "CartTrigger";
