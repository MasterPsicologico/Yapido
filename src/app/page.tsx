
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CategoryCard } from '@/components/category/CategoryCard';
import { Button } from '@/components/ui/button';
import { Plus, Store as StoreIcon, Loader2, Image as ImageIcon, X, LayoutGrid, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { collection, query, where, limit, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  if (isUserLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1">
        {user ? <AuthenticatedHome /> : <UnauthenticatedLanding auth={auth} />}
      </main>
    </div>
  );
}

function AuthenticatedHome() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [openStore, setOpenStore] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  // Consulta de Categorías Principales (Globales)
  const categoriesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'mainCategories'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: mainCategories, isLoading: loadingCategories } = useCollection(categoriesQuery);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setBase64Image(compressed);
        toast({ title: "Imagen lista", description: "Otimizada con éxito." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleCreateMainCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!base64Image) {
      toast({ title: "Imagen requerida", variant: "destructive" });
      return;
    }

    setIsRegistering(true);
    try {
      const catRef = doc(collection(firestore, 'mainCategories'));
      setDocumentNonBlocking(catRef, {
        id: catRef.id,
        name,
        description,
        imageUrl: base64Image,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "Categoría Creada", description: "Ya puedes asignar tiendas aquí." });
      setOpenCategory(false);
      setBase64Image(null);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const mainCategoryId = formData.get('mainCategoryId') as string;
    const address = formData.get('address') as string;

    if (!mainCategoryId) {
      toast({ title: "Selecciona una categoría", variant: "destructive" });
      return;
    }

    setIsRegistering(true);
    try {
      const storeRef = doc(collection(firestore, 'stores'));
      setDocumentNonBlocking(storeRef, {
        id: storeRef.id,
        ownerId: user?.uid,
        mainCategoryId,
        name,
        address,
        status: 'active',
        imageUrl: base64Image || `https://picsum.photos/seed/${storeRef.id}/800/600`,
        createdAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "¡Vitrina Lanzada!", description: "Tu tienda ya es parte del Marketplace." });
      setOpenStore(false);
      setBase64Image(null);
    } catch (e) {
      toast({ title: "Error al registrar", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-12 overflow-x-hidden">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div className="space-y-2 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight">Aguachica Digital</h1>
          <p className="text-slate-500 text-lg font-medium">Explora las mejores vitrinas morrocoyeras por categoría.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Admin: Crear Categoría Principal */}
          <Dialog open={openCategory} onOpenChange={setOpenCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full h-14 px-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto text-base">
                <LayoutGrid className="w-5 h-5" /> Nueva Categoría Pro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic">Crear Categoría Principal</DialogTitle>
                <DialogDescription>Solo el administrador puede definir estos grupos globales.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMainCategory} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre de Categoría</Label>
                  <Input name="name" placeholder="Ej: Panaderías y Cafés" required />
                </div>
                <div className="space-y-2">
                  <Label>Imagen Representativa</Label>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300">
                    {base64Image ? (
                      <>
                        <Image src={base64Image} alt="Preview" fill className="object-cover" />
                        <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => setBase64Image(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-200 transition-colors">
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subir Imagen</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción Corta</Label>
                  <Textarea name="description" placeholder="Ej: El aroma de nuestra tierra en un solo lugar." required />
                </div>
                <Button type="submit" className="w-full h-12 font-bold" disabled={isRegistering || isCompressing}>
                  {isRegistering ? <Loader2 className="animate-spin" /> : <Plus className="mr-2" />} Crear Categoría
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dueño: Registrar Tienda */}
          <Dialog open={openStore} onOpenChange={setOpenStore}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-14 px-10 gap-2 bg-primary hover:bg-primary/90 text-white font-black shadow-xl shadow-primary/20 w-full sm:w-auto text-base">
                <StoreIcon className="w-5 h-5" /> Registrar Mi Vitrina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Lanza tu Negocio</DialogTitle>
                <DialogDescription>Selecciona la categoría principal a la que pertenece tu tienda.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterStore} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre del Negocio</Label>
                  <Input name="name" placeholder="Ej: Panadería Morrocoy" required />
                </div>
                <div className="space-y-2">
                  <Label>Categoría Principal (Admin)</Label>
                  <Select name="mainCategoryId" required>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona a qué grupo perteneces..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                      {(!mainCategories || mainCategories.length === 0) && (
                        <p className="p-2 text-xs text-muted-foreground italic">No hay categorías globales creadas.</p>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Foto de Fachada</Label>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300">
                    {base64Image ? (
                      <>
                        <Image src={base64Image} alt="Preview" fill className="object-cover" />
                        <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => setBase64Image(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-200 transition-colors">
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-400 text-center px-4 uppercase tracking-widest">Subir Foto Real</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección Física</Label>
                  <Input name="address" placeholder="Ej: Calle 5 con Carrera 20" required />
                </div>
                <Button type="submit" className="w-full h-14 font-black text-lg bg-secondary hover:bg-secondary/90 shadow-xl shadow-secondary/20" disabled={isRegistering || isCompressing}>
                  {isRegistering ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />} Registrar Mi Vitrina
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid de Categorías Principales */}
      <section>
        <div className="flex items-center gap-2 mb-8">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Vitrinas por Categoría</h2>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-[40px]" />)}
          </div>
        ) : mainCategories && mainCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {mainCategories.map((cat) => (
              <CategoryCard key={cat.id} category={cat as any} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[50px] shadow-sm border border-slate-100 px-6">
            <LayoutGrid className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-400 italic">No hay categorías creadas aún.</h3>
            <p className="text-slate-400 text-sm mt-2">Usa el botón "Nueva Categoría Pro" para empezar.</p>
          </div>
        )}
      </section>

      {/* Promo AI Banner */}
      <div className="bg-slate-900 rounded-[40px] md:rounded-[50px] p-10 md:p-14 flex flex-col lg:flex-row items-center gap-10 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
        <div className="relative z-10 flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1 border border-white/10">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Tecnología Inteligente</span>
          </div>
          <h3 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">
            ¿Tienes un negocio <br className="hidden md:block" /> en Aguachica?
          </h3>
          <p className="text-slate-400 text-lg max-w-lg font-medium mx-auto lg:mx-0">
            Nuestra IA crea descripciones profesionales para tus productos en segundos. ¡Vende más hoy!
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-full lg:w-auto">
          <Button onClick={() => setOpenStore(true)} size="lg" className="rounded-full h-16 px-10 text-xl font-black bg-white text-slate-900 hover:bg-slate-100 gap-3 group/btn w-full lg:w-auto">
            Empezar ahora <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function UnauthenticatedLanding({ auth }: { auth: any }) {
  const handleLogin = () => initiateGoogleSignIn(auth);
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-black">
      <div className="absolute inset-0 z-0">
        <Image src="https://picsum.photos/seed/morrocoy/1920/1080" alt="Aguachica Cesar" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>
      <div className="container relative z-10 px-6 sm:px-12 text-center space-y-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-700">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white/90">Aguachica • Cesar • Orgullo Morrocoyero</span>
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white leading-none tracking-tighter uppercase animate-in fade-in zoom-in duration-1000">
          Vitriniando <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient block">Marketplace</span>
        </h1>
        <p className="text-base sm:text-xl lg:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-tight animate-in fade-in slide-in-from-bottom-10 duration-1000 px-4">
          Lleva tu negocio de Aguachica al siguiente nivel. <br className="hidden sm:block" />
          <span className="text-secondary font-black italic">¡La vitrina más moderna del Cesar!</span>
        </p>
        <div className="pt-8 animate-in fade-in slide-in-from-bottom-20 duration-1000 px-4">
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90 text-white font-black h-20 px-12 rounded-full text-xl sm:text-2xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all group w-full sm:w-auto">
            ENTRAR A VITRINIAR <ArrowRight className="ml-4 w-6 h-6 sm:w-8 sm:h-8 group-hover:translate-x-3 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
