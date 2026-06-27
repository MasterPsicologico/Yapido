'use client';

import { cn } from '@/lib/utils';
import type { Message } from '@/lib/types';
import { Sparkles, Copy, Check, User } from 'lucide-react';
import { useAuth } from '@/firebase';
import ReactMarkdown from 'react-markdown';
import { memo, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

// Componente para el cursor parpadeante
const BlinkingCursor = () => (
  <span className="animate-pulse inline-block w-2 h-4 bg-[#22d3ee] ml-1 translate-y-0.5" />
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
        'group/message flex items-start w-full gap-3 md:gap-4 animate-in fade-in duration-300',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="h-8 w-8 shrink-0 flex items-center justify-center border-2 border-[#22d3ee] bg-[hsl(220,15%,10%)]" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)', boxShadow: '0 0 10px rgba(34,211,238,0.3)' }}>
          <Sparkles className="h-4 w-4 text-[#22d3ee]" />
        </div>
      )}

      <div className={cn(
        'relative flex flex-col gap-2 min-w-0',
        isUser ? 'items-end' : 'items-start'
      )}>
        <div
          className={cn(
            'relative px-4 py-3 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl',
            'min-w-0 break-words',
            isUser
              ? 'brutal-message brutal-message-user'
              : 'brutal-message brutal-message-ai'
          )}
        >
          {/* Integrated Copy Button */}
          {!isStreaming && contentString && !isUser && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 bg-[hsl(220,20%,8%)] border border-[hsl(220,15%,20%)] text-[hsl(220,10%,50%)] hover:text-[#22d3ee] hover:border-[#22d3ee] shadow-sm z-10 transition-all"
              onClick={handleCopy}
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="sr-only">Copiar mensaje</span>
            </Button>
          )}

          <ReactMarkdown
            className={cn(
                "prose prose-sm dark:prose-invert prose-headings:m-0 prose-ul:m-0 prose-ol:m-0 prose-p:m-0 prose-li:m-0",
                isUser ? "prose-strong:text-white text-white" : "prose-strong:text-[hsl(220,10%,95%)] text-[hsl(220,10%,80%)]"
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
        <div className="h-8 w-8 shrink-0 flex items-center justify-center border-2 border-[#60a5fa] bg-[hsl(220,15%,10%)]" style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)', boxShadow: '0 0 10px rgba(96,165,250,0.3)' }}>
          <User className="h-4 w-4 text-[#60a5fa]" />
        </div>
      )}
    </div>
  );
}

export default memo(ChatMessage);
