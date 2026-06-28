'use client';

import { useRef, useEffect, useState } from 'react';
import type { IAMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, Copy, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    <div className={`ia-message-row ${isSharma ? 'ai' : 'user'}`}>
      {isSharma && (
        <div className="ia-avatar sharma">AS</div>
      )}
      <div className={`ia-bubble ${isSharma ? 'ai' : 'user'}`}>
        <button
            className="ia-bubble-copy"
            onClick={handleCopy}
            aria-label="Copiar mensaje"
        >
            {isCopied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </button>
        <p className="leading-relaxed">{message.content}</p>
      </div>
      {!isSharma && (
        <div className="ia-avatar tanaka">KT</div>
      )}
    </div>
  );
};


export default function Conversation({ sessionId, status, onStart, onPause, onResume, currentTurn, messages }: ConversationProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [messages, status]);

  const renderStatus = () => {
    switch (status) {
      case 'running':
        return (
          <div className="ia-status-bar">
             <div className="spinner" />
             <span>Turno {currentTurn}: Pensando...</span>
          </div>
        );
      case 'paused':
        return <div className="ia-status-bar">Simulación pausada.</div>;
      case 'finished':
        return <div className="ia-status-bar">Simulación finalizada. {messages.length}/20 turnos.</div>;
      default:
        return null;
    }
  };

  return (
    <div className="ia-conversation">
      <div className="ia-conversation-scroll" ref={viewportRef}>
        <div className="ia-conversation-inner">
          {sessionId ? (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {renderStatus()}
            </>
          ) : (
            <div className="ia-empty-state">
                <Card className="ia-empty-card">
                    <h2 className="ia-empty-title">Inicia una simulación</h2>
                    <p className="ia-empty-desc">Presiona "Nueva Simulación" para comenzar o selecciona una del historial.</p>
                </Card>
            </div>
          )}
        </div>
      </div>

      <div className="ia-controls">
        <div className="ia-controls-inner">
          {status === 'idle' ? (
            <button className="ia-btn-new" onClick={onStart}>
              <Play className="h-4 w-4" />
              Nueva Simulación
            </button>
          ) : status === 'running' ? (
            <>
              <div className="ia-status-bar">
                <div className="spinner" />
                <span>Turno {currentTurn}: Procesando...</span>
              </div>
              <button className="ia-btn-pause" onClick={onPause}>
                <Pause className="h-4 w-4" />
                Pausar
              </button>
            </>
          ) : (status === 'paused' || (status === 'finished' && messages.length < 20)) ? (
            <>
              <button className="ia-btn-new" onClick={onResume}>
                <Play className="h-4 w-4" />
                Reanudar
              </button>
            </>
          ) : status === 'finished' && messages.length >= 20 ? (
            <button className="ia-btn-new" onClick={onStart}>
              <Play className="h-4 w-4" />
              Nueva Simulación
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}