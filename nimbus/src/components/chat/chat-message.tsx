'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import { useAuth } from '@/firebase';
import ReactMarkdown from 'react-markdown';
import { memo, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Componente para el cursor parpadeante
const BlinkingCursor = () => (
  <span className="animate-pulse inline-block w-2 h-4 bg-foreground/70 ml-1 translate-y-0.5" />
);

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  // Blindaje contra objetos inesperados [object Object]
  const contentString = useMemo(() => {
    if (typeof message.content === 'string') return message.content;
    if (typeof message.content === 'object' && message.content !== null) {
        // Intentamos extraer el campo 'content' o serializamos a JSON legible
        const obj = message.content as any;
        return obj.content || obj.text || JSON.stringify(obj, null, 2);
    }
    return String(message.content || '');
  }, [message.content]);

  const handleCopy = () => {
    if (!contentString) return;
    navigator.clipboard.writeText(contentString).then(() => {
        setIsCopied(true);
        toast({
            title: "Texto copiado",
        });
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div
      className={cn(
        'group/message flex items-start w-full gap-2 md:gap-4 animate-in fade-in duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
            <AvatarFallback>
                <Sparkles className="h-5 w-5" />
            </AvatarFallback>
        </Avatar>
      )}

      <div className={cn(
        'relative flex flex-col gap-2 min-w-0', 
        isUser ? 'items-end' : 'items-start'
      )}>
        <div
          className={cn(
            'relative px-4 py-3 rounded-2xl max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl',
            'min-w-0 break-words',
            isUser
              ? 'bg-blue-600 text-white rounded-br-none shadow-md'
              : 'bg-card border rounded-bl-none border-blue-500/10'
          )}
        >
          {/* Integrated Copy Button */}
          {!isStreaming && contentString && !isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 bg-background/80 backdrop-blur-sm border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 shadow-sm z-10 transition-all rounded-full"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="sr-only">Copiar mensaje</span>
            </Button>
          )}

          <ReactMarkdown
            className={cn(
                "prose prose-sm dark:prose-invert prose-headings:m-0 prose-ul:m-0 prose-ol:m-0",
                isUser ? "prose-strong:text-white text-white" : "prose-strong:text-foreground text-foreground"
            )}
            rehypePlugins={[rehypeRaw]}
            remarkPlugins={[remarkGfm]}
          >
            {contentString}
          </ReactMarkdown>
          {isStreaming && <BlinkingCursor />}
        </div>
      </div>

      {isUser && authUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={authUser?.photoURL ?? ''} alt={authUser?.displayName ?? 'Usuario'} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export default memo(ChatMessage);
