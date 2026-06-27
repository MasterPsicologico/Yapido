'use client';

import { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import type { Chat, Message, ProfileData, CachedProfile } from '@/lib/types';
import { generateChatTitle, getAIResponse, getSmartComposeSuggestions, analyzeVoiceMessageAction } from '@/app/c/actions';
import { useToast } from '@/hooks/use-toast';
import ChatMessages from './chat-messages';
import ChatInput from './chat-input';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth, useCollection, useFirestore } from '@/firebase';
import { collection, query, orderBy, Timestamp, doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import ImageWhiteboard from '@/components/chat/image-whiteboard';
import AdsterraBanner from '@/components/AdsterraBanner';

interface ChatPanelProps {
  chat: Chat;
  appendMessage: (chatId: string, message: Omit<Message, 'id'>) => Promise<void>;
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<void>;
  profile: ProfileData | null;
}

function ChatPanel({ chat, appendMessage, updateChat, profile }: ChatPanelProps) {
  const [isResponding, setIsResponding] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshingSuggestions, setIsRefreshingSuggestions] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [showAd, setShowAd] = useState(false);

  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const firestore = useFirestore();

  const messagesQuery = useMemo(
    () =>
      user?.uid && firestore && chat.id
        ? query(
            collection(firestore, `users/${user.uid}/chats/${chat.id}/messages`),
            orderBy('timestamp', 'asc')
          )
        : undefined,
    [user?.uid, firestore, chat.id]
  );
  
  const { data: messages, loading: messagesLoading } = useCollection<Message>(messagesQuery);
  
  const triggerBlueprintUpdate = useCallback(async () => {
    // This function can be expanded if the chatbot needs its own separate "thought" process.
  }, []);
  

  const fetchSuggestions = useCallback(async () => {
    const currentMessages = messages || [];
    if (currentMessages.length === 0) return;
    // This function can be called to manually refresh suggestions.
    setIsRefreshingSuggestions(true);
    try {
        const historyString = currentMessages.map((m) => `${m.role}: ${m.content}`).join('\n');
        const newSuggestions = await getSmartComposeSuggestions(historyString);
        setSuggestions(newSuggestions.slice(0, 3));
    } catch (error) {
        console.error("Error fetching suggestions", error);
    } finally {
        setIsRefreshingSuggestions(false);
    }
  }, [messages]);

  const getAIResponseAndUpdate = useCallback(async (currentMessages: Message[]) => {
    if (!user || !firestore) return;
    setIsResponding(true);
    setShowAd(false);
    setSuggestions([]); // Clear previous suggestions immediately
    if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
    }

    try {
      const historyForAI: Message[] = currentMessages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Timestamp ? m.timestamp.toDate() : m.timestamp,
      }));

      const { response: aiResponseContent, newRole } = await getAIResponse(
        historyForAI,
        user.uid,
        chat.anchorRole || null,
        profile
      );
      
      if (newRole && newRole !== chat.anchorRole) {
        await updateChat(chat.id, { anchorRole: newRole });
      }
      
      const aiMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: aiResponseContent,
        timestamp: Timestamp.now(),
      };
      
      setIsResponding(false); 
      setShowAd(true);
      await appendMessage(chat.id, aiMessage);
      
      const updatedMessages = [...currentMessages, { ...aiMessage, id: uuidv4() }];


      // Delayed suggestions logic
      const words = aiResponseContent.split(/\s+/).length;
      const readingTime = Math.max(12000, words * 360); // min 12 seconds
      
      suggestionTimeoutRef.current = setTimeout(async () => {
         const historyString = updatedMessages.map((m) => `${m.role}: ${m.content}`).join('\n');
         const newSuggestions = await getSmartComposeSuggestions(historyString);
         setSuggestions(newSuggestions.slice(0, 3));
      }, readingTime);


      // Title generation
      if (currentMessages.length <= 1 && (chat.title === 'Nuevo Chat' || !chat.title)) {
          const userMessage = currentMessages.find(m => m.role === 'user');
          if (userMessage) {
              const conversationForTitle = `User: ${userMessage.content}\nAssistant: ${aiResponseContent}`;
              const newTitle = await generateChatTitle({ conversationForTitle });
              await updateChat(chat.id, { title: newTitle });
          }
      }
      
      triggerBlueprintUpdate();

    } catch (error) {
        console.error("Error getting AI response:", error);
        setIsResponding(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener una respuesta de la IA. Por favor, inténtalo de nuevo.",
        });
    }
  }, [user, firestore, chat, appendMessage, updateChat, toast, triggerBlueprintUpdate, profile]);


 const handleSendMessage = useCallback(async (input: string, audioDataUri?: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para chatear." });
      return;
    }
    setShowAd(false);
    const textInput = input.trim();
    if (!textInput && !audioDataUri) return;
    
    let messageContent = textInput;
    
    const userMessage: Omit<Message, 'id'> = {
      role: 'user',
      content: messageContent,
      timestamp: Timestamp.now(),
    };

    // Removido await para interfaz optimista instantánea
    appendMessage(chat.id, userMessage);
    
    // Always get an AI response, even if transcription failed, so the context is not lost.
    await getAIResponseAndUpdate([...(messages || []), { ...userMessage, id: uuidv4() } as any]);

  }, [user, messages, appendMessage, chat.id, getAIResponseAndUpdate, toast]);


  useEffect(() => {
    // Clear any pending suggestion timeout when the component unmounts or chat changes
    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
      }
    };
  }, [chat.id]);

  const handleClearSuggestions = () => {
    setSuggestions([]);
    if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current);
    }
  };


  return (
    <div className="flex flex-col h-full flex-1 min-w-0">
       <header className="brutal-header flex h-14 items-center justify-between p-2 md:p-4 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && <SidebarTrigger />}
           <div className='min-w-0'>
            <h2 className="text-base md:text-lg font-bold truncate tracking-wide text-[hsl(220,10%,90%)] uppercase">
              {chat.title}
            </h2>
            {chat.anchorRole && (
              <p className='text-xs text-[hsl(220,10%,40%)] truncate tracking-wider'>Rol: {chat.anchorRole}</p>
            )}
           </div>
        </div>
         <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWhiteboardOpen(true)}
                className="text-[hsl(220,10%,40%)] hover:text-[hsl(220,10%,90%)] hover:bg-[hsl(220,15%,15%)]"
            >
                <ImageIcon className="h-5 w-5" />
                <span className="sr-only">Abrir Pizarra de Imagen</span>
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto min-w-0 brutal-scroll">
        <ChatMessages messages={messages || []} isResponding={isResponding || messagesLoading} />
      </main>
      <footer className="shrink-0 px-2 py-4 md:px-4 md:py-4 border-t border-[hsl(220,15%,18%)] bg-[hsl(220,20%,6%)]">
        {showAd && <div className="mb-4"><AdsterraBanner /></div>}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isResponding || messagesLoading}
          suggestions={suggestions}
          onClearSuggestions={handleClearSuggestions}
          onRefreshSuggestions={fetchSuggestions}
          isRefreshingSuggestions={isRefreshingSuggestions}
        />
      </footer>
      <ImageWhiteboard
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        conversationHistory={messages ? messages.map(m => `${m.role}: ${m.content}`).join('\n') : ''}
      />
    </div>
  );
}

export default memo(ChatPanel);
