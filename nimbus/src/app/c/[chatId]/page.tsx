'use client';

import { useCallback, useMemo, memo, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  Timestamp,
  getDocs,
  setDoc,
  limit,
  startAfter,
  getDocsFromCache,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';

import { useAuth, useFirestore, useDocument } from '@/firebase';
import type { Chat, Message, CachedProfile, ProfileData } from '@/lib/types';
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import ChatSidebar from '@/components/chat/chat-sidebar';
import ChatPanel from '@/components/chat/chat-panel';
import EmptyChat from '@/components/chat/empty-chat';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { getAIResponse, generateChatTitle } from '@/app/c/actions';
import { useToast } from '@/hooks/use-toast';
import type { Omit } from 'react-hook-form';

const CHAT_PAGE_SIZE = 15;

function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string | undefined;

  const { user, loading: authLoading } = useAuth();
  const firestore = useFirestore();
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // --- Start of New Pagination Logic ---
  const [chats, setChats] = useState<Chat[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [hasMoreChats, setHasMoreChats] = useState(true);

  const baseQuery = useMemo(() => 
    user?.uid && firestore
      ? query(
          collection(firestore, `users/${user.uid}/chats`),
          orderBy('latestMessageAt', 'desc')
        )
      : undefined,
  [user?.uid, firestore]);

  const loadInitialChats = useCallback(async () => {
    if (!baseQuery) return;
    setIsLoadingChats(true);
    try {
      const first = query(baseQuery, limit(CHAT_PAGE_SIZE));
      const documentSnapshots = await getDocs(first);

      const newChats = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(newChats);
      
      const last = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(last);
      setHasMoreChats(documentSnapshots.docs.length === CHAT_PAGE_SIZE);
    } catch (error) {
      console.error("Error loading initial chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  }, [baseQuery]);

  useEffect(() => {
    loadInitialChats();
  }, [loadInitialChats]);

  const loadMoreChats = useCallback(async () => {
    if (!baseQuery || !lastVisible) {
      setHasMoreChats(false);
      return;
    };
    
    setIsLoadingChats(true);
    try {
      const next = query(baseQuery, startAfter(lastVisible), limit(CHAT_PAGE_SIZE));
      const documentSnapshots = await getDocs(next);
      
      const newChats = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(prev => [...prev, ...newChats]);

      const last = documentSnapshots.docs[documentSnapshots.docs.length - 1];
      setLastVisible(last);
      setHasMoreChats(documentSnapshots.docs.length === CHAT_PAGE_SIZE);
    } catch (error) {
       console.error("Error loading more chats:", error);
    } finally {
       setIsLoadingChats(false);
    }
  }, [baseQuery, lastVisible]);
  // --- End of New Pagination Logic ---


  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadProfile = useCallback(() => {
    if (user) {
      const storageKey = `psych-profile-${user.uid}`;
      const cachedItem = localStorage.getItem(storageKey);
      if (cachedItem) {
        try {
          const data: CachedProfile = JSON.parse(cachedItem);
          setProfile(data.profile);
        } catch (e) {
          console.error("Failed to parse cached profile", e);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
    window.addEventListener('focus', loadProfile);
    return () => {
      window.removeEventListener('focus', loadProfile);
    };
  }, [loadProfile]);

  const activeChat = useMemo(
    () => chats?.find((chat) => chat.id === chatId),
    [chats, chatId]
  );
  
   const createChat = useCallback(async (firstMessage: Omit<Message, 'id'>): Promise<string | undefined> => {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión.' });
        return;
    }
    
    const chatsCollectionRef = collection(firestore, `users/${user.uid}/chats`);
    const newChatRef = doc(chatsCollectionRef);
    const messagesColRef = collection(newChatRef, 'messages');

    try {
        const batch = writeBatch(firestore);

        const newChatData: Omit<Chat, 'id'> = {
            title: 'Nuevo Chat...',
            userId: user.uid,
            createdAt: serverTimestamp() as Timestamp,
            path: `/c/${newChatRef.id}`,
            latestMessageAt: serverTimestamp() as Timestamp,
            anchorRole: 'El Asistente General',
        };
        batch.set(newChatRef, newChatData);
        batch.set(doc(messagesColRef), firstMessage);

        await batch.commit();

        // Optimistically add to UI
        const optimisticChat: Chat = {
          ...newChatData,
          id: newChatRef.id,
          createdAt: Timestamp.now(), // approximate
          latestMessageAt: Timestamp.now()
        };
        setChats(prev => [optimisticChat, ...prev]);


        router.push(newChatData.path, { scroll: false });
        
        // This now happens after navigation. The UI will update reactively.
        (async () => {
            const tempFirstMessage = { ...firstMessage, timestamp: new Date() };
            const { response: aiResponseContent, newRole } = await getAIResponse(
                [tempFirstMessage as any],
                user.uid,
                newChatData.anchorRole,
                profile
            );

            const aiMessage: Omit<Message, 'id'> = {
                role: 'assistant',
                content: aiResponseContent,
                timestamp: Timestamp.now(),
            };
            await addDoc(messagesColRef, aiMessage);

            const conversationForTitle = `User: ${firstMessage.content}\nAssistant: ${aiResponseContent}`;
            const newTitle = await generateChatTitle(conversationForTitle);
            
            const updatePayload = { 
                title: newTitle, 
                latestMessageAt: aiMessage.timestamp,
                ...(newRole && { anchorRole: newRole })
            };
            await updateDoc(newChatRef, updatePayload);
        })();

        return newChatRef.id;

    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: chatsCollectionRef.path,
            operation: 'create',
            requestResourceData: { userId: user.uid },
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        } else {
           console.error("Error creating chat:", serverError);
           toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el chat.' });
        }
        return undefined;
    }
  }, [user, firestore, router, toast, profile]);

  const startNewChat = useCallback(async () => {
    router.push('/');
  }, [router]);
  
  const appendMessage = useCallback(
    async (chatId: string, message: Omit<Message, 'id'>) => {
        if (!user || !firestore) return;
        const messagesColRef = collection(firestore, `users/${user.uid}/chats/${chatId}/messages`);
        const chatRef = doc(firestore, `users/${user.uid}/chats/${chatId}`);
        
        try {
          await addDoc(messagesColRef, message);
          await updateDoc(chatRef, { latestMessageAt: message.timestamp });
        } catch (serverError: any) {
          if (serverError.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: messagesColRef.path,
              operation: 'write', 
              requestResourceData: message,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
          } else {
             console.error("Error appending message and updating chat:", serverError);
          }
        }
    },
    [user, firestore]
  );
  
  const updateChat = useCallback(
    async (chatId: string, data: Partial<Chat>) => {
      if (!user || !firestore) return;
      const chatRef = doc(firestore, `users/${user.uid}/chats/${chatId}`);
      updateDoc(chatRef, data).catch((serverError) => {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: chatRef.path,
            operation: 'update',
            requestResourceData: data,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        } else {
           console.error("Error updating chat:", serverError);
        }
      });
    },
    [user, firestore]
  );


  const removeChat = useCallback(
    async (chatId: string) => {
      if (!user || !firestore) return;

      setChats(prev => prev.filter(c => c.id !== chatId));
      
      const chatRef = doc(firestore, `users/${user.uid}/chats`, chatId);
      const messagesRef = collection(chatRef, 'messages');
      
      const messagesSnap = await getDocs(messagesRef);
      const batch = writeBatch(firestore);
      messagesSnap.forEach(doc => batch.delete(doc.ref));
      batch.delete(chatRef);

      batch.commit().catch((serverError) => {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: chatRef.path,
            operation: 'delete',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
      });

      if (activeChat?.id === chatId) {
        router.push('/');
      }
    },
    [user, firestore, activeChat, router]
  );

  const clearChats = useCallback(async () => {
    if (!user || !firestore || !chats) return;

    setChats([]);
    setLastVisible(null);
    setHasMoreChats(false);

    const batch = writeBatch(firestore);
    for (const chat of chats) {
        const chatRef = doc(firestore, `users/${user.uid}/chats`, chat.id);
        const messagesRef = collection(chatRef, 'messages');
        const messagesSnap = await getDocs(messagesRef);
        messagesSnap.forEach(doc => batch.delete(doc.ref));
        batch.delete(chatRef);
    }
    
    batch.commit().catch((serverError) => {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
              path: `users/${user.uid}/chats`,
              operation: 'delete',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
    });

    router.push('/');
  }, [user, firestore, chats, router]);

  return (
    <SidebarProvider>
      <div className="bg-background text-foreground flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
            <Sidebar>
            <ChatSidebar
                chats={chats || []}
                activeChatId={chatId}
                isLoading={isLoadingChats && chats.length === 0}
                isLoadingMore={isLoadingChats && chats.length > 0}
                hasMore={hasMoreChats}
                loadMore={loadMoreChats}
                removeChat={removeChat}
                clearChats={clearChats}
                startNewChat={startNewChat}
            />
            </Sidebar>
            <SidebarInset className="flex-1 flex flex-col min-w-0">
            {chatId && activeChat ? (
                <ChatPanel
                key={chatId}
                chat={activeChat}
                appendMessage={appendMessage}
                updateChat={updateChat}
                profile={profile}
                />
            ) : (
                <EmptyChat createChat={createChat} />
            )}
            </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default memo(ChatPage);
