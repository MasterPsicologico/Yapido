
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
  Save, 
  Store as StoreIcon, 
  ChevronDown, 
  ChevronUp, 
  Package, 
  TrendingUp, 
  Clock, 
  Star, 
  Eye, 
  Settings, 
  Wallet,
  Loader2,
  Sparkles,
  LayoutGrid,
  Zap,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [aiProductName, setAiProductName] = useState("");
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Consulta de la tienda del usuario
  const storeQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: stores, isLoading: loadingStore } = useCollection(storeQuery);
  const myStore = stores?.[0];

  // Consulta de productos
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !myStore?.id) return null;
    return query(collection(firestore, 'products'), where('storeId', '==', myStore.id));
  }, [firestore, myStore?.id]);

  const { data: products } = useCollection(productsQuery);

  // Consulta de pedidos para estadísticas
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !myStore?.id) return null;
    return query(collection(firestore, 'orders'), where('storeOwnerId', '==', user.uid));
  }, [firestore, user?.uid, myStore?.id]);

  const { data: orders } = useCollection(ordersQuery);

  // Cálculos de Dashboard
  const stats = useMemo(() => {
    if (!orders) return { totalSales: 0, pending: 0, revenue: 0 };
    const delivered = orders.filter(o => o.status === 'delivered');
    const pending = orders.filter(o => ['pending', 'preparing', 'ready_for_pickup'].includes(o.status));
    const revenue = delivered.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
    return { totalSales: delivered.length, pending: pending.length, revenue };
  }, [orders]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setProductImage(compressed);
        toast({ title: "Imagen lista" });
      } catch (e) {
        toast({ title: "Error en imagen", variant: "destructive" });
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !myStore || !productImage) {
      toast({ title: "Completa los datos", description: "Asegúrate de subir una foto.", variant: "destructive" });
      return;
    }

    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const price = Number(fd.get('price'));
    const description = fd.get('description') as string;

    setIsSaving(true);
    try {
      const prodRef = collection(firestore, 'products');
      addDocumentNonBlocking(prodRef, {
        name,
        price,
        description,
        imageUrl: productImage,
        storeId: myStore.id,
        storeName: myStore.name,
        storeOwnerId: user.uid,
        status: 'available',
        createdAt: serverTimestamp()
      });

      toast({ title: "¡Producto Publicado!", description: "Ya está visible en tu vitrina." });
      setIsFormOpen(false);
      setProductImage(null);
      setAiProductName("");
      (e.target as HTMLFormElement).reset();
    } catch (e) {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted || loadingProfile || loadingStore) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Cargando Consola</p>
        </div>
      </div>
    );
  }

  if (!myStore && !loadingStore) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl">
            <StoreIcon className="w-12 h-12 text-slate-200" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Sin Vitrina Activa</h2>
          <p className="text-slate-400 max-w-sm font-medium">Registra tu primer negocio para acceder a la consola de administración.</p>
          <Button asChild className="rounded-full h-14 px-10 text-lg font-black bg-primary">
            <Link href="/">Ir a Registrar Mi Vitrina</Link>
          </Button>
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
            <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-primary/20">
              <LayoutGrid className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                Consola de Negocio
              </h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {myStore?.name} • Online
              </p>
            </div>
          </div>
          
          <Button variant="outline" className="rounded-full h-12 px-6 border-slate-200 font-black text-xs uppercase tracking-widest gap-2 hover:bg-white shadow-sm" asChild>
            <Link href={`/stores/${myStore?.id}`}>
              Ver Vitrina Real <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <Collapsible 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen}
          className="mb-10"
        >
          <CollapsibleTrigger asChild>
            <Button className={cn(
              "w-full h-16 rounded-[24px] font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-widest gap-3 transition-all shadow-xl px-4",
              isFormOpen ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-slate-50 border-none"
            )}>
              {isFormOpen ? <ChevronUp className="w-5 h-5" /> : <Plus className="w-5 h-5 text-primary" />}
              <span className="truncate">
                {isFormOpen ? "Cerrar Publicador" : "Publicar Nuevo Artículo en la Tienda"}
              </span>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4 animate-in slide-in-from-top-4 duration-500">
            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white">
              <CardHeader className="bg-slate-50 border-b p-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Publicador de Artículos</CardTitle>
                </div>
                <CardDescription className="text-slate-500 font-medium text-sm leading-relaxed max-w-2xl">
                  Sigue las instrucciones a continuación para digitalizar tu inventario. Una ficha de producto bien diligenciada puede <b>aumentar tus ventas hasta en un 40%</b> al generar mayor confianza en el cliente.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre del Producto</Label>
                      <Input 
                        name="name" 
                        placeholder="Ej: Croissant de Almendras" 
                        className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" 
                        value={aiProductName}
                        onChange={(e) => setAiProductName(e.target.value)}
                        required 
                      />
                      <p className="flex items-start gap-2 text-[10px] text-slate-400 font-medium leading-tight px-2">
                        <Info className="w-3 h-3 shrink-0 text-primary" />
                        Usa un nombre corto y descriptivo. Esto facilitará que tus clientes encuentren el artículo al buscar en la vitrina.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Precio Sugerido (COP)</Label>
                      <Input name="price" type="number" placeholder="Ej: 15000" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-primary text-xl" required />
                      <p className="flex items-start gap-2 text-[10px] text-slate-400 font-medium leading-tight px-2">
                        <Info className="w-3 h-3 shrink-0 text-primary" />
                        Define un precio competitivo. Los clientes prefieren ver el valor real desde el inicio para tomar una decisión de compra rápida.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Descripción Estratégica</Label>
                        <AIDescriptionButton 
                          productName={aiProductName} 
                          keyFeatures={[]} 
                          onGenerated={(desc) => {
                            if (descriptionRef.current) {
                              descriptionRef.current.value = desc;
                            }
                          }} 
                        />
                      </div>
                      <Textarea 
                        ref={descriptionRef}
                        name="description" 
                        placeholder="Describe el sabor, ingredientes o beneficios..." 
                        className="min-h-[120px] rounded-2xl bg-slate-50 border-none font-medium leading-relaxed" 
                        required 
                      />
                      <p className="flex items-start gap-2 text-[10px] text-slate-400 font-medium leading-tight px-2">
                        <Info className="w-3 h-3 shrink-0 text-primary" />
                        Cuéntale al cliente por qué este producto es especial. Usa nuestra <b>IA</b> para crear un texto que resalte los beneficios y cierre la venta por ti.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Fotografía Real del Producto</Label>
                    <div className="flex-1 relative aspect-video lg:aspect-auto rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors flex items-center justify-center">
                      {productImage ? (
                        <>
                          <Image src={productImage} alt="Preview" fill className="object-cover" />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-4 right-4 rounded-full h-10 w-10 shadow-xl"
                            onClick={() => setProductImage(null)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center gap-3 cursor-pointer p-10 text-center">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center">
                            {isCompressing ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : <Plus className="w-8 h-8 text-slate-300" />}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subir Imagen HD</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                    <p className="flex items-start gap-2 text-[10px] text-slate-400 font-medium leading-tight px-2 mb-4">
                      <Info className="w-3 h-3 shrink-0 text-primary" />
                      Los clientes compran con los ojos. Una foto real, nítida y bien iluminada es el factor número uno para recibir nuevos pedidos.
                    </p>
                    <Button type="submit" disabled={isSaving || isCompressing} className="h-16 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-lg gap-3 shadow-2xl shadow-primary/20">
                      {isSaving ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-6 h-6 text-yellow-300" /> Publicar en Vitrina</>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <Badge className="bg-green-100 text-green-700 border-none text-[9px] font-black uppercase">Ventas Exitosas</Badge>
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Ingresos Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <span className="text-3xl font-black tracking-tighter">
                  {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.revenue)}
                </span>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Desde que te uniste a Vitriniando</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
                <Badge className="bg-orange-100 text-orange-700 border-none text-[9px] font-black uppercase">Acción Requerida</Badge>
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Órdenes Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-5xl font-black tracking-tighter text-orange-600">{stats.pending}</span>
                <Button variant="ghost" size="sm" className="rounded-full font-black text-[10px] uppercase tracking-widest h-8" asChild>
                  <Link href="/admin/orders">Atender Ahora</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-black uppercase">Stock Digital</Badge>
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Total Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-4xl font-black tracking-tighter">{products?.length || 0}</span>
                  <span className="text-xs font-bold text-slate-300 ml-2">SKUs</span>
                </div>
                <div className="h-10 w-24 bg-slate-50 rounded-lg flex items-center justify-center gap-1">
                  <div className="w-1 h-4 bg-primary rounded-full animate-pulse" />
                  <div className="w-1 h-6 bg-primary rounded-full animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-primary rounded-full animate-pulse delay-150" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">Configuración</h3>
                <p className="text-[10px] font-medium text-slate-400 mt-1 px-4">Actualiza tu logo, banner y contacto oficial.</p>
              </div>
              <Button variant="outline" className="rounded-full h-9 px-6 text-[10px] font-black uppercase tracking-widest w-full" asChild>
                <Link href={`/stores/${myStore?.id}`}>Configurar Vitrina</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className={cn(
            "border-none rounded-[32px] shadow-sm overflow-hidden group hover:shadow-xl transition-all",
            myStore?.featuresHidden ? "bg-slate-100" : "bg-gradient-to-br from-primary to-secondary text-white"
          )}>
            <CardContent className="p-8 flex flex-col items-center text-center gap-4 h-full">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform",
                myStore?.featuresHidden ? "bg-white text-slate-400" : "bg-white/20 text-white backdrop-blur-md"
              )}>
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest italic">Modo Vitrina</h3>
                <p className={cn(
                  "text-[10px] font-medium mt-1 px-4",
                  myStore?.featuresHidden ? "text-slate-400" : "text-white/70"
                )}>
                  {myStore?.featuresHidden ? "Tus destacados están ocultos." : "Toda tu artillería visual es pública."}
                </p>
              </div>
              <Button className={cn(
                "rounded-full h-10 px-8 text-[10px] font-black uppercase tracking-widest w-full mt-auto",
                myStore?.featuresHidden ? "bg-slate-900 text-white" : "bg-white text-primary"
              )} asChild>
                <Link href={`/stores/${myStore?.id}`}>Gestionar Visibilidad</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600 mb-2">
                <Star className="w-5 h-5 fill-yellow-600" />
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Score de Confianza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-black tracking-tighter italic">4.9</span>
                <div className="flex flex-col">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />)}
                  </div>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Excelente</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-[32px] shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all">
            <CardHeader className="pb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-2">
                <Zap className="w-5 h-5" />
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Popularidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400">Alcance</span>
                  <span className="text-purple-600">+12% hoy</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[75%] rounded-full" />
                </div>
                <p className="text-[9px] font-bold text-slate-300 italic text-center">Tus productos están siendo vitrineados.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
