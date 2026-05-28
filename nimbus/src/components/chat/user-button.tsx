'use client';

import { useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { LogIn, LogOut, User, Camera, Loader2, Moon, Sun, Briefcase, UserCircle, Dumbbell, Star, BookOpen, BrainCircuit, MessageSquarePlus, Info, Copy, Atom, Music, Book, PenSquare } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useStorage } from '@/firebase/storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { SecurityRuleContext } from '@/firebase/errors';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
    { href: "/ia-vs-ia", icon: Atom, label: "IA vs IA" },
    { href: "/creator", icon: PenSquare, label: "GICI" },
    { href: "/profile", icon: UserCircle, label: "Perfil Psicológico" },
    { href: "/recorder", icon: Music, label: "Grabadora Psicológica"},
    { href: "/gym", icon: Dumbbell, label: "Gimnasio Emocional" },
    { href: "/dreams", icon: Star, label: "Portal de Sueños" },
    { href: "/syi", icon: Atom, label: "Laboratorio SYI" },
    { href: "/blog", icon: Book, label: "Blog" },
    { href: "/marketplace", icon: Briefcase, label: "Marketplace" },
    { href: "/torah-code", icon: BookOpen, label: "Oráculo de la Torá" },
];


export default function UserButton() {
  const { user, loading, signInWithGoogle, signOut, auth, userRoles } = useAuth();
  const storage = useStorage();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme, theme } = useTheme();
  
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [isCopied, setIsCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
    }
  }, [user?.photoURL]);

  const handleNewChat = useCallback(async () => {
    if (!user || !firestore || isCreatingChat) return;

    setIsCreatingChat(true);

    const newChatData = {
      title: 'Nuevo Chat',
      userId: user.uid,
      createdAt: serverTimestamp(),
      path: '',
      latestMessageAt: serverTimestamp(),
      anchorRole: 'El Asistente General',
    };

    const chatsCollectionRef = collection(firestore, `users/${user.uid}/chats`);
    try {
      const newChatRef = await addDoc(chatsCollectionRef, newChatData);
      const path = `/c/${newChatRef.id}`;
      await updateDoc(newChatRef, { path });
      router.push(path);
    } catch (serverError: any) {
        if (serverError.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: chatsCollectionRef.path,
            operation: 'create',
            requestResourceData: newChatData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        } else {
           console.error("Error creating chat:", serverError);
           toast({
              variant: "destructive",
              title: "Error",
              description: "No se pudo crear un nuevo chat."
           });
        }
    } finally {
        setIsCreatingChat(false);
    }
  }, [user, firestore, router, isCreatingChat, toast]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !storage) return;

    setIsUploading(true);

    const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }
      
      setPhotoURL(downloadURL);

      toast({
        title: '¡Éxito!',
        description: 'Tu foto de perfil se ha actualizado.',
      });

    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo subir la imagen. Inténtalo de nuevo.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCopyId = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setIsCopied(true);
    toast({ title: "ID de Usuario Copiado" });
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const isProfessional = userRoles.includes('professional');
  const isAdmin = userRoles.includes('admin');


  if (!isClient || loading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <Button onClick={signInWithGoogle} variant="outline">
        <LogIn className="mr-2 h-4 w-4" />
        Iniciar sesión
      </Button>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        disabled={isUploading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={photoURL ?? ''} alt={user?.displayName ?? ''} />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
               <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div 
                            className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 cursor-pointer"
                            onClick={handleCopyId}
                        >
                            <span className="truncate font-mono text-xs">{user.uid}</span>
                            <Copy className="h-3 w-3" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{isCopied ? "¡Copiado!" : "Copiar ID de Usuario"}</p>
                    </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
           <DropdownMenuGroup>
             <DropdownMenuLabel className="text-xs">Navegación</DropdownMenuLabel>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleNewChat(); }} disabled={isCreatingChat}>
                {isCreatingChat ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquarePlus className="mr-2 h-4 w-4" />}
                <span>{isCreatingChat ? 'Creando...' : 'Nuevo Chat'}</span>
              </DropdownMenuItem>
             {navItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4"/>
                        <span>{item.label}</span>
                    </Link>
                </DropdownMenuItem>
             ))}
           </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs">Ajustes y más</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : (
                <Moon className="mr-2 h-4 w-4" />
              )}
              <span>Cambiar a modo {theme === 'dark' ? 'claro' : 'oscuro'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleUploadClick} disabled={isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              <span>{isUploading ? 'Subiendo...' : 'Cambiar foto'}</span>
            </DropdownMenuItem>
            {!isProfessional && !isAdmin && (
               <DropdownMenuItem asChild>
                  <Link href="/apply">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Conviértete en Profesional</span>
                  </Link>
                </DropdownMenuItem>
            )}
             <DropdownMenuItem asChild>
                  <Link href="/legal/about">
                    <Info className="mr-2 h-4 w-4" />
                    <span>Quiénes Somos</span>
                  </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                  <Link href="/legal/oracle-anatomy">
                    <Atom className="mr-2 h-4 w-4" />
                    <span>Anatomía del Oráculo</span>
                  </Link>
              </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
