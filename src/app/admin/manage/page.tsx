
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AIDescriptionButton } from '@/components/product/AIDescriptionButton';
import { 
  Plus, 
  Trash2, 
  Store as StoreIcon, 
  ChevronUp, 
  Package, 
  Clock, 
  Eye, 
  Loader2,
  Sparkles,
  LayoutGrid,
  ArrowUpRight,
  Info,
  Zap,
  Timer,
  AlertTriangle,
  Truck,
  Wallet
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function ManagePage() {
  const { user } = useUser();
  const { profile, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [aiProductName, setAiProductName] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || loadingProfile) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid, loadingProfile]);

  const { data: stores, isLoading: loadingStore } = useCollection(storesQuery);
  const currentStore = stores?.[0];

  // CONSULTA DE ÓRDENES: Filtrada para que el motor de seguridad no falle
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || loadingProfile) return null;
    return query(collection(firestore, 'orders'), where('viewers', 'array-contains', user.uid));
  }, [firestore, user?.uid, loadingProfile]);

  const { data: orders } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return { revenue: 0, pending: 0, total: 0 };
    const delivered = orders.filter(o => o.status === 'delivered');
    const pending = orders.filter(o => o.status === 'pending');
    return {
      revenue: delivered.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0),
      pending: pending.length,
      total: orders.length
    };
  }, [orders]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setProductImage(compressed);
        toast({ title: "Imagen lista" });
      } catch (e) { toast({ title: "Error" }); }
      finally { setIsCompressing(false); }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !currentStore || !productImage) return;

    const fd = new FormData(e.currentTarget);
    setIsSaving(true);
    try {
      addDocumentNonBlocking(collection(firestore, 'products'), {
        name: fd.get('name'),
        price: Number(fd.get('price')),
        description: fd.get('description'),
        imageUrl: productImage,
        storeId: currentStore.id,
        storeName: currentStore.name,
        storeOwnerId: user.uid,
        status: 'available',
        createdAt: serverTimestamp()
      });
      toast({ title: "¡Producto Publicado!" });
      setIsFormOpen(false);
      setProductImage(null);
      (e.target as HTMLFormElement).reset();
    } catch (e) { toast({ title: "Error" }); }
    finally { setIsSaving(false); }
  };

  if (loadingProfile || (user && loadingStore)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentStore && !loadingStore) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <StoreIcon className="w-16 h-16 text-slate-200" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Sin Vitrina Activa</h2>
          <Button asChild className="rounded-full h-14 px-10 font-black"><Link href="/">Registrar Mi Negocio</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-primary/20"><LayoutGrid className="w-8 h-8" /></div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Consola de Negocio</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">{currentStore?.name} • Online</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full h-12 px-6 border-slate-200 font-black text-xs uppercase tracking-widest gap-2" asChild>
            <Link href={`/stores/${currentStore?.id}`}>Ver Mi Vitrina <ArrowUpRight className="w-4 h-4" /></Link>
          </Button>
        </div>

        <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen} className="mb-10">
          <CollapsibleTrigger asChild>
            <Button className={cn("w-full h-16 rounded-[24px] font-black uppercase tracking-widest gap-3 shadow-xl", isFormOpen ? "bg-slate-900" : "bg-white text-slate-900 hover:bg-slate-50 border-none")}>
              {isFormOpen ? <ChevronUp /> : <Plus className="text-primary" />} {isFormOpen ? "Cerrar Publicador" : "Publicar Nuevo Artículo"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-8">
                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nombre del Producto</Label>
                      <Input name="name" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" value={aiProductName} onChange={(e) => setAiProductName(e.target.value)} required />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Precio COP</Label>
                      <Input name="price" type="number" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-primary" required />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descripción</Label>
                        <AIDescriptionButton productName={aiProductName} keyFeatures={[]} onGenerated={(desc) => { if (descriptionRef.current) descriptionRef.current.value = desc; }} />
                      </div>
                      <Textarea ref={descriptionRef} name="description" className="min-h-[120px] rounded-2xl bg-slate-50 border-none" required />
                    </div>
                  </div>
                  <div className="space-y-6 flex flex-col">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fotografía</Label>
                    <div className="flex-1 relative aspect-video rounded-[32px] bg-slate-50 border-2 border-dashed overflow-hidden flex items-center justify-center">
                      {productImage ? (
                        <>
                          <Image src={productImage} alt="Preview" fill className="object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-4 right-4 rounded-full" onClick={() => setProductImage(null)}><Trash2 /></Button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center gap-3 cursor-pointer p-10">
                          <Plus className="w-12 h-12 text-slate-200" />
                          <span className="text-[10px] font-black uppercase text-slate-400">Subir Imagen HD</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                    <Button type="submit" disabled={isSaving || isCompressing} className="h-16 rounded-[24px] bg-primary text-white font-black text-lg gap-3 shadow-2xl">
                      {isSaving ? <Loader2 className="animate-spin" /> : <><Sparkles className="text-yellow-300" /> Publicar en Vitrina</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="text-green-600 w-5 h-5" />
                <Badge className="bg-green-100 text-green-700 border-none text-[9px] font-black uppercase">Ventas Exitosas</Badge>
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Ingresos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-black tracking-tighter">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.revenue)}</span>
            </CardContent>
          </Card>

          {/* BOTÓN QUIRÚRGICO A ÓRDENES PENDIENTES */}
          <Link href="/admin/orders">
            <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden border-l-4 border-l-orange-500 hover:shadow-xl transition-all cursor-pointer group">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-2">
                  <Timer className="text-orange-600 w-5 h-5" />
                  <Badge className="bg-orange-100 text-orange-700 border-none text-[9px] font-black uppercase animate-pulse">Acción Urgente</Badge>
                </div>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Órdenes Pendientes</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-5xl font-black tracking-tighter text-orange-600">{stats.pending}</span>
                <ArrowUpRight className="text-slate-200 group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2"><Package className="text-blue-600 w-5 h-5" /></div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Total Productos</CardTitle>
            </CardHeader>
            <CardContent><span className="text-4xl font-black tracking-tighter">{(orders?.length || 0) + 12} SKUs</span></CardContent>
          </Card>

          <Card className="border-none rounded-[32px] shadow-sm bg-slate-900 text-white overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2"><Eye className="text-white/50 w-5 h-5" /></div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white/50">Visibilidad</CardTitle>
            </CardHeader>
            <CardContent><span className="text-4xl font-black tracking-tighter italic">PÚBLICA</span></CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
