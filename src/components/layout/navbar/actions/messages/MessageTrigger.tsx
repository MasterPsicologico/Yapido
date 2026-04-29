
"use client";

import * as React from 'react';
import { MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';

interface MessageTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
  hasUnread: boolean;
}

export const MessageTrigger = React.forwardRef<HTMLButtonElement, MessageTriggerProps>(
  ({ count, hasUnread, className, onClick, ...props }, ref) => {
    const { user } = useUser();
    const auth = useAuth();

    const handleProtectedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!user) {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Bandeja Privada",
          description: "Inicia sesión para ver tus conversaciones.",
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
        <MessageSquareText className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", (hasUnread && user) ? "text-secondary animate-pulse" : "text-slate-400")} />
        {count > 0 && user && (
          <span className="absolute -top-1 -right-1 bg-secondary text-white text-[7px] sm:text-[8px] font-black w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] flex items-center justify-center border-[1.5px] border-white shadow-sm ring-1 ring-secondary/20">
            {count}
          </span>
        )}
      </Button>
    );
  }
);

MessageTrigger.displayName = "MessageTrigger";
