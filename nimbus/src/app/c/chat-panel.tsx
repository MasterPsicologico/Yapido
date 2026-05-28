'use client';

import { useState, useCallback, memo, useEffect, useMemo, useRef } from 'react';
import type { Chat, Message, ProfileData, CachedProfile, ChatbotState } from '@/lib/types';
import { generateChatTitle, getAIResponse, getSmartComposeSuggestions } from '@/app/c/actions';
import { updatePsychologicalBlueprint } from '@/ai/flows/update-psychological-blueprint';
import { useToast } from '@/hooks/use-toast';
import ChatMessages from './chat-messages';
import ChatInput from './chat-input';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth, useCollection, useFirestore, useDocument } from '@/firebase/provider';
import { collection, query, orderBy, Timestamp, doc, getDoc, setDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon } from 'lucide-react';
import ImageWhiteboard from '@/components/chat/image-whiteboard';
import AdsterraBanner from '@/components/AdsterraBanner';

interface ChatPanelProps {
  chat: Chat;
  appendMessage: (chatId: string, message: Omit<Message, 'id'>) => Promise<void>;
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<void>;
}

function ChatPanel({ chat, appendMessage, updateChat }: ChatPanelProps) {
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
  
  const chatbotStateRef = useMemo(() => user ? doc(firestore, `users/${user.uid}/chatbotState/main`) : undefined, [user, firestore]);
  const { data: chatbotState, loading: chatbotStateLoading } = useDocument<ChatbotState>(chatbotStateRef);


  const triggerBlueprintUpdate = useCallback(async (currentMessages: Message[]) => {
    if (!user || !firestore || !currentMessages || currentMessages.length === 0) return;

    const fullChatHistory = currentMessages.map(m => `[${(m.timestamp as Timestamp).toDate().toISOString()}] ${m.role}: ${m.content}`).join('\n');
    const previousBlueprintString = chatbotState ? JSON.stringify(chatbotState.blueprint) : '{}';

    try {
        const newBlueprint = await updatePsychologicalBlueprint({
            fullChatHistory,
            previousBlueprint: previousBlueprintString,
        });

        if (chatbotStateRef) {
            await setDoc(chatbotStateRef, {
                blueprint: newBlueprint,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
    } catch (e) {
        console.error("Failed to update psychological blueprint:", e);
    }
  }, [user, firestore, chatbotState, chatbotStateRef]);
  

  const fetchSuggestions = useCallback(async () => {
    const currentMessages = messages || [];
    if (currentMessages.length === 0) return;
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
    setSuggestions([]);
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
        chatbotState?.blueprint || null
      );
      
      if (newRole && newRole !== chat.anchorRole) {
        await updateChat(chat.id, { anchorRole: newRole });
      }
      
      const aiMessage: Omit<Message, 'id'> = {
        role: 'assistant',
        content: aiResponseContent,
        timestamp: Timestamp.now(),
      };
      
      await appendMessage(chat.id, aiMessage);
      
      setIsResponding(false); 
      setShowAd(true);
      
      const updatedMessages = [...currentMessages, { ...aiMessage, id: uuidv4() } as Message];

      // Now trigger the blueprint update with the full conversation
      triggerBlueprintUpdate(updatedMessages);

      const words = aiResponseContent.split(/\s+/).length;
      const readingTime = Math.max(12000, words * 360);
      
      suggestionTimeoutRef.current = setTimeout(async () => {
         const historyString = updatedMessages.map((m) => `${m.role}: ${m.content}`).join('\n');
         const newSuggestions = await getSmartComposeSuggestions(historyString);
         setSuggestions(newSuggestions.slice(0, 3));
      }, readingTime);


      if (currentMessages.length <= 1 && (chat.title === 'Nuevo Chat' || !chat.title)) {
          const userMessage = currentMessages.find(m => m.role === 'user');
          if (userMessage) {
              const conversationForTitle = `User: ${userMessage.content}\nAssistant: ${aiResponseContent}`;
              const newTitle = await generateChatTitle({ conversationHistory: conversationForTitle });
              await updateChat(chat.id, { title: title });
          }
      }

    } catch (error) {
        console.error("Error getting AI response:", error);
        setIsResponding(false);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo obtener una respuesta de la IA. Por favor, inténtalo de nuevo.",
        });
    }
  }, [user, firestore, chat, appendMessage, updateChat, toast, triggerBlueprintUpdate, chatbotState]);


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

    await appendMessage(chat.id, userMessage);
    
    await getAIResponseAndUpdate([...(messages || []), { ...userMessage, id: uuidv4() } as Message]);

  }, [user, messages, appendMessage, chat.id, getAIResponseAndUpdate, toast]);


  useEffect(() => {
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
       <header className="flex h-14 items-center justify-between p-2 md:p-4 border-b shrink-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && <SidebarTrigger />}
           <div className='min-w-0'>
            <h2 className="text-base md:text-lg font-semibold truncate">
              {chat.title}
            </h2>
            {chat.anchorRole && (
              <p className='text-xs text-muted-foreground truncate'>Rol: {chat.anchorRole}</p>
            )}
           </div>
        </div>
         <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWhiteboardOpen(true)}
                className="text-muted-foreground hover:text-foreground"
            >
                <ImageIcon className="h-5 w-5" />
                <span className="sr-only">Abrir Pizarra de Imagen</span>
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto min-w-0">
        <ChatMessages messages={messages || []} isResponding={isResponding || messagesLoading} />
      </main>
      <footer className="shrink-0 px-2 py-4 md:px-4 md:py-4 border-t bg-background/95 backdrop-blur-sm">
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
