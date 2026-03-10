
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { CategoryCard, MainCategory } from '@/components/category/CategoryCard';
import { Button } from '@/components/ui/button';
import { Plus, Store as StoreIcon, Loader2, Image as ImageIcon, X, LayoutGrid, Sparkles, ArrowRight, Edit3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
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
        <main className="flex-1 w-full px-4 py-12">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
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
  const [editingCategory, setEditingCategory] = useState<MainCategory | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const categoriesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'mainCategories'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: mainCategories, isLoading: loadingCategories } = useCollection(categoriesQuery);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.85);
        setBase64Image(compressed);
        toast({ title: "Imagen lista", description: "Optimizada con éxito." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleCreateOrUpdateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    setIsRegistering(true);
    try {
      if (editingCategory) {
        const catRef = doc(firestore, 'mainCategories', editingCategory.id);
        const updateData: any = {
          name,
          description,
          updatedAt: serverTimestamp(),
        };
        if (base64Image) updateData.imageUrl = base64Image;
        
        updateDocumentNonBlocking(catRef, updateData);
        toast({ title: "Categoría Actualizada" });
      } else {
        if (!base64Image) {
          toast({ title: "Imagen requerida", variant: "destructive" });
          setIsRegistering(false);
          return;
        }
        const catRef = doc(collection(firestore, 'mainCategories'));
        setDocumentNonBlocking(catRef, {
          id: catRef.id,
          name,
          description,
          imageUrl: base64Image,
          createdAt: serverTimestamp(),
        }, { merge: true });
        toast({ title: "Categoría Creada" });
      }
      
      setOpenCategory(false);
      setEditingCategory(null);
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
        updatedAt: serverTimestamp(),
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
    <div className="w-full py-6 sm:py-10 space-y-8">
      {/* Header Section */}
      <div className="px-4 sm:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-tight">Aguachica Digital</h1>
          <p className="text-slate-500 text-sm sm:text-lg font-medium">Explora las mejores vitrinas morrocoyeras.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Dialog open={openCategory} onOpenChange={(v) => { if(!v) { setEditingCategory(null); setBase64Image(null); } setOpenCategory(v); }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto">
                <LayoutGrid className="w-4 h-4" /> Categoría Pro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic">{editingCategory ? "Editar Categoría" : "Crear Categoría Global"}</DialogTitle>
                <DialogDescription>{editingCategory ? "Modifica los detalles del grupo." : "Define un nuevo grupo para el marketplace."}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdateCategory} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input name="name" defaultValue={editingCategory?.name} placeholder="Ej: Panaderías y Cafés" required />
                </div>
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300">
                    {(base64Image || editingCategory?.imageUrl) ? (
                      <>
                        <Image src={base64Image || editingCategory!.imageUrl} alt="Preview" fill className="object-cover" />
                        <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => { setBase64Image(null); if(editingCategory) editingCategory.imageUrl = ""; }}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-200">
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subir Imagen</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea name="description" defaultValue={editingCategory?.description} placeholder="Ej: El aroma de nuestra tierra." required />
                </div>
                <Button type="submit" className="w-full h-12 font-bold" disabled={isRegistering || isCompressing}>
                  {isRegistering ? <Loader2 className="animate-spin" /> : editingCategory ? <Edit3 className="mr-2" /> : <Plus className="mr-2" />} {editingCategory ? "Guardar Cambios" : "Crear Categoría"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openStore} onOpenChange={setOpenStore}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-12 px-8 gap-2 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 w-full sm:w-auto">
                <StoreIcon className="w-4 h-4" /> Registrar Mi Vitrina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Lanza tu Negocio</DialogTitle>
                <DialogDescription>Elige la categoría global de tu tienda.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRegisterStore} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre del Negocio</Label>
                  <Input name="name" placeholder="Ej: Panadería Morrocoy" required />
                </div>
                <div className="space-y-2">
                  <Label>Categoría Global</Label>
                  <Select name="mainCategoryId" required>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecciona el grupo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mainCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Foto Principal</Label>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300">
                    {base64Image ? (
                      <>
                        <Image src={base64Image} alt="Preview" fill className="object-cover" />
                        <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => setBase64Image(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-200">
                        <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subir Foto Real</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Input name="address" placeholder="Ej: Calle 5 con Carrera 20" required />
                </div>
                <Button type="submit" className="w-full h-14 font-black text-lg bg-secondary hover:bg-secondary/90 shadow-lg" disabled={isRegistering || isCompressing}>
                  {isRegistering ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />} Registrar Mi Vitrina
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <section className="px-4 sm:px-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-6 bg-primary rounded-full" />
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Vitrinas por Categoría</h2>
        </div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 sm:h-64 rounded-none" />)}
          </div>
        ) : mainCategories && mainCategories.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {mainCategories.map((cat) => (
              <CategoryCard 
                key={cat.id} 
                category={cat as any} 
                onEdit={(c) => {
                  setEditingCategory(c);
                  setOpenCategory(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-slate-100">
            <LayoutGrid className="w-12 h-12 mx-auto text-slate-200 mb-2" />
            <h3 className="text-lg font-bold text-slate-400 italic">No hay categorías globales.</h3>
          </div>
        )}
      </section>

      <div className="bg-slate-900 w-full p-8 md:p-14 flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10 flex-1 space-y-4 text-center lg:text-left">
          <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
            ¿Tienes un negocio <br className="hidden md:block" /> en Aguachica?
          </h3>
          <p className="text-slate-400 text-base font-medium mx-auto lg:mx-0 max-w-md">
            Lleva tu catálogo al mundo digital en segundos con nuestra tecnología inteligente.
          </p>
        </div>
        <div className="relative z-10 shrink-0 w-full lg:w-auto">
          <Button onClick={() => setOpenStore(true)} size="lg" className="rounded-full h-14 px-8 text-lg font-black bg-white text-slate-900 hover:bg-slate-100 gap-2 w-full lg:w-auto">
            Empezar ahora <ArrowRight className="w-5 h-5" />
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
      <div className="container relative z-10 px-6 text-center space-y-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white/90">Aguachica • Cesar • Marketplace</span>
        </div>
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-white leading-none tracking-tighter uppercase">
          Vitriniando <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient block">Marketplace</span>
        </h1>
        <p className="text-lg sm:text-2xl text-white/80 font-medium max-w-2xl mx-auto leading-tight px-4">
          La vitrina digital más moderna del Cesar. <br />
          <span className="text-secondary font-black italic">¡Impulsa tu negocio hoy!</span>
        </p>
        <div className="pt-4">
          <Button onClick={handleLogin} size="lg" className="bg-primary hover:bg-primary/90 text-white font-black h-16 px-10 rounded-full text-lg shadow-2xl shadow-primary/40 transition-all group w-full sm:w-auto">
            ENTRAR A VITRINIAR <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
