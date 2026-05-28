'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import type { IAMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, Copy, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface ConversationProps {
  sessionId: string | null;
  status: 'idle' | 'running' | 'paused' | 'finished';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  currentTurn: number;
  messages: IAMessage[];
}

const MessageBubble = ({ message }: { message: IAMessage }) => {
  const isSharma = message.agentId === 'dr-sharma';
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
        setIsCopied(true);
        toast({ title: "Texto copiado" });
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
            'group/message flex items-start w-full gap-2 md:gap-4',
            isSharma ? 'justify-start' : 'justify-end'
        )}
    >
      {isSharma && (
        <Avatar className="h-8 w-8 bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
      )}
      <div className={cn(
        'relative px-4 py-3 rounded-2xl max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl',
        'min-w-0 break-words',
        isSharma ? 'bg-card border rounded-bl-none border-blue-500/10' : 'bg-blue-600 text-white rounded-br-none shadow-sm'
      )}>
        {/* Integrated Copy Button */}
        <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -right-2 h-7 w-7 bg-background/80 backdrop-blur-sm border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 shadow-sm z-10 transition-all rounded-full opacity-0 group-hover/message:opacity-100"
            onClick={handleCopy}
        >
            {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>

        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
      {!isSharma && (
        <Avatar className="h-8 w-8 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
          <AvatarFallback>KT</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
};


export default function Conversation({ sessionId, status, onStart, onPause, onResume, currentTurn, messages }: ConversationProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages, status]);

  const renderStatus = () => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-2 justify-center text-sm text-blue-400/60 p-4">
             <Loader2 className="h-4 w-4 animate-spin"/>
             <span>Turno {currentTurn}: Pensando...</span>
          </div>
        );
      case 'paused':
        return <p className="text-sm text-center text-muted-foreground p-4">Simulación pausada.</p>;
      case 'finished':
        return <p className="text-sm text-center text-muted-foreground p-4">Simulación finalizada.</p>;
      default:
        return null;
    }
  }
  
  const renderControls = () => (
    <div className="flex justify-center items-center gap-4">
      {status === 'idle' || (status === 'finished' && messages.length >= 20) ? (
        <Button onClick={onStart} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 shadow-lg shadow-blue-500/20 transform transition-transform hover:scale-105">
          <Play className="mr-2 h-5 w-5" />
          Nueva Simulación
        </Button>
      ) : status === 'running' ? (
        <Button onClick={onPause} variant="outline" className="rounded-full border-blue-500/30">
          <Pause className="mr-2 h-4 w-4" />
          Pausar
        </Button>
      ) : (status === 'paused' || (status === 'finished' && messages.length < 20)) ? (
        <Button onClick={onResume} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
          <Play className="mr-2 h-4 w-4" />
          {status === 'finished' ? 'Continuar Simulación' : 'Reanudar'}
        </Button>
      ) : null}
    </div>
  )

  return (
    <div className="h-full flex flex-col justify-between p-4 bg-background/30">
      <div className="flex-grow relative">
        <ScrollArea className="absolute inset-0" viewportRef={viewportRef}>
          <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            {sessionId ? (
               <AnimatePresence>
                    {(messages || []).map((msg) => (
                        <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {renderStatus()}
                </AnimatePresence>
            ) : (
                <div className="h-full flex items-center justify-center text-center py-20">
                    <Card className="bg-card/50 border-blue-500/20 p-8 max-w-sm">
                        <h2 className="text-xl font-bold mb-2 text-blue-400">Inicia una simulación</h2>
                        <p className="text-muted-foreground text-sm">Presiona "Nueva Simulación" para comenzar o selecciona una del historial.</p>
                    </Card>
                </div>
            )}
          </div>
        </ScrollArea>
      </div>
      <div className="flex-shrink-0 pt-4 border-t border-blue-500/10">
        {renderControls()}
      </div>
    </div>
  );
}
