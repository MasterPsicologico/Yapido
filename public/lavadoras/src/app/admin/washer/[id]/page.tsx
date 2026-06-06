"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Save, Loader2, Store, Clock, MapPin, Phone, 
  Image as ImageIcon, DollarSign, Users, Package, Settings,
  TrendingUp, Star, Calendar, Upload, X, Check, Plus, Trash2,
  ChevronDown, AlertCircle, BarChart3, Activity
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, serverTimestamp, collection, query, where, updateDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const checkIsBusinessOpen = (openTime?: string, closeTime?: string) => {
  if (!openTime || !closeTime) return true;
  // SiopenTime es "00:00" significa siempre abierto
  if (openTime === '00:00' && closeTime === '00:00') return true;
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  if (closeMinutes < openMinutes) return currentTotalMinutes >= openMinutes || currentTotalMinutes < closeMinutes;
  return currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;
};

const checkDayIsOpen = (operatingHours: OperatingHour[] | undefined) => {
  if (!operatingHours || operatingHours.length === 0) return true;
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = days[new Date().getDay()];
  const todayHours = operatingHours.find(h => h.day === today);
  if (!todayHours || !todayHours.enabled) return false;
  return checkIsBusinessOpen(todayHours.open, todayHours.close);
};

interface OperatingHour {
  day: string;
  open: string;
  close: string;
  enabled: boolean;
}

interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  category: string;
}

export default function WasherStoreAdminPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params?.id as string;
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  if (!storeId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900">ID de tienda no encontrado</h2>
          <p className="text-slate-500 mt-2">No se pudo cargar la tienda. Intenta desde la página de categorías.</p>
          <Button onClick={() => router.push('/profile')} className="mt-6">Volver a mi perfil</Button>
        </div>
      </div>
    );
  }

  const storeRef = useMemoFirebase(() => 
    (!firestore || !storeId) ? null : doc(firestore, 'stores', storeId),
    [firestore, storeId]
  );
  const { data: store, isLoading: storeLoading } = useDoc(storeRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !storeId) return null;
    return query(collection(firestore, 'orders'), where('storeId', '==', storeId));
  }, [firestore, storeId]);
  const { data: orders } = useCollection(ordersQuery);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    cityName: '',
    email: '',
    washerCount: 0,
    openTime: '06:00',
    closeTime: '22:00',
    isOpen: true,
    features: [] as string[],
    commissionRate: 0.20,
    minRentalHours: 2,
    deliveryAvailable: true,
    deliveryFee: 5000,
    washerTypes: [] as { id: string; name: string; pricePerHour: number; description: string }[]
  });

  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([
    { day: 'Lunes', open: '06:00', close: '22:00', enabled: true },
    { day: 'Martes', open: '06:00', close: '22:00', enabled: true },
    { day: 'Miércoles', open: '06:00', close: '22:00', enabled: true },
    { day: 'Jueves', open: '06:00', close: '22:00', enabled: true },
    { day: 'Viernes', open: '06:00', close: '22:00', enabled: true },
    { day: 'Sábado', open: '08:00', close: '20:00', enabled: true },
    { day: 'Domingo', open: '08:00', close: '18:00', enabled: true },
  ]);

  const [newFeature, setNewFeature] = useState('');
  const [newWasherType, setNewWasherType] = useState({ name: '', pricePerHour: 0, description: '' });

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        description: store.description || '',
        address: store.address || '',
        phone: store.phone || '',
        cityName: store.cityName || '',
        email: store.email || '',
        washerCount: store.washerCount || 0,
        openTime: store.openTime || '06:00',
        closeTime: store.closeTime || '22:00',
        isOpen: store.isOpen ?? true,
        features: store.features || [],
        commissionRate: store.commissionRate ?? 0.20,
        minRentalHours: store.minRentalHours || 2,
        deliveryAvailable: store.deliveryAvailable ?? true,
        deliveryFee: store.deliveryFee || 5000,
        washerTypes: store.washerTypes || []
      });
      if (store.operatingHours) {
        setOperatingHours(store.operatingHours);
      }
    }
  }, [store]);

  const handleSave = async () => {
    if (!firestore || !storeId || !storeRef) return;
    setIsSaving(true);
    try {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const today = days[new Date().getDay()];
      const todayHours = operatingHours.find(h => h.day === today);
      const currentOpenTime = todayHours?.enabled ? todayHours.open : '00:00';
      const currentCloseTime = todayHours?.enabled ? todayHours.close : '23:59';

      await updateDoc(storeRef, {
        ...formData,
        operatingHours,
        openTime: currentOpenTime,
        closeTime: currentCloseTime,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
      toast({ title: "Cambios guardados", description: "La información de tu tienda ha sido actualizada." });
    } catch (err) {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const addWasherType = () => {
    if (newWasherType.name && newWasherType.pricePerHour > 0) {
      setFormData(prev => ({ 
        ...prev, 
        washerTypes: [...prev.washerTypes, { ...newWasherType, id: Date.now().toString() }] 
      }));
      setNewWasherType({ name: '', pricePerHour: 0, description: '' });
    }
  };

  const removeWasherType = (id: string) => {
    setFormData(prev => ({ ...prev, washerTypes: prev.washerTypes.filter(w => w.id !== id) }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoURL' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const stats = useMemo(() => {
    if (!orders) return { total: 0, active: 0, completed: 0, revenue: 0 };
    const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'completed'].includes(o.status));
    const completedOrders = orders.filter(o => ['delivered', 'completed'].includes(o.status));
    const revenue = completedOrders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
    return { total: orders.length, active: activeOrders.length, completed: completedOrders.length, revenue };
  }, [orders]);

  if (profileLoading || storeLoading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  }

  if (!store) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Tienda no encontrada</h2>
          <p className="text-slate-500 mt-2">La tienda que buscas no existe o fue eliminada.</p>
          <Button onClick={() => router.push('/profile')} className="mt-6">Volver a mi perfil</Button>
        </div>
      </div>
    );
  }

  const isStoreOpen = (formData.isOpen ?? true) && checkDayIsOpen(operatingHours);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f7fa]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => router.push('/profile')} className="gap-2 text-slate-500 hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="font-black text-xs uppercase">Guardar Cambios</span>
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-2xl">
            <Store className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-slate-900">
              {store.name || 'Mi Tienda'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={isStoreOpen ? "bg-green-500 text-white border-none" : "bg-red-500 text-white border-none"}>
                {isStoreOpen ? 'ABIERTA' : 'CERRADA'}
              </Badge>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Panel de Administración</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-none rounded-[24px] bg-gradient-to-br from-primary to-primary/80 text-white p-6 shadow-xl">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-70">Órdenes Totales</p>
                  <p className="text-3xl font-black italic">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none rounded-[24px] bg-white p-6 shadow-lg">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Activas</p>
                  <p className="text-3xl font-black text-primary italic">{stats.active}</p>
                </div>
                <Activity className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none rounded-[24px] bg-white p-6 shadow-lg">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Completadas</p>
                  <p className="text-3xl font-black text-green-500 italic">{stats.completed}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-none rounded-[24px] bg-white p-6 shadow-lg">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Ingresos</p>
                  <p className="text-2xl font-black text-slate-900">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.revenue)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white border-none rounded-[24px] p-1 h-14 shadow-sm mb-8 grid grid-cols-4">
            <TabsTrigger value="general" className="rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Store className="w-4 h-4 mr-2" />General
            </TabsTrigger>
            <TabsTrigger value="hours" className="rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />Horario
            </TabsTrigger>
            <TabsTrigger value="washers" className="rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" />Lavadoras
            </TabsTrigger>
            <TabsTrigger value="delivery" className="rounded-xl font-black text-[10px] uppercase data-[state=active]:bg-primary data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />Entrega
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="border-none rounded-[32px] bg-white shadow-xl p-8">
              <CardContent className="p-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre de la Tienda</Label>
                    <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black text-lg" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Teléfono</Label>
                    <Input value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black text-lg" placeholder="300 000 0000" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descripción</Label>
                    <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="rounded-[16px] bg-slate-50 border-none font-black p-4 min-h-[120px]" placeholder="Describe tu negocio de alquiler de lavadoras..." />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección</Label>
                    <Input value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black" placeholder="Calle 123, Ciudad" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ciudad</Label>
                    <Input value={formData.cityName} onChange={(e) => setFormData(prev => ({ ...prev, cityName: e.target.value }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black" placeholder="Bogotá" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Correo Electrónico</Label>
                    <Input value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black" type="email" placeholder="tienda@email.com" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Número de Lavadoras</Label>
                    <Input type="number" value={formData.washerCount} onChange={(e) => setFormData(prev => ({ ...prev, washerCount: parseInt(e.target.value) || 0 }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black text-lg" />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Características / Servicios</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.features.map((feature, i) => (
                        <Badge key={i} className="bg-slate-100 text-slate-700 px-3 py-2 font-black text-xs uppercase flex items-center gap-2">
                          {feature}
                          <button onClick={() => removeFeature(i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Agregar característica..." className="h-12 rounded-[12px] bg-slate-50 border-none" onKeyPress={(e) => e.key === 'Enter' && addFeature()} />
                      <Button onClick={addFeature} size="sm" className="h-12 px-4 bg-primary rounded-[12px]"><Plus className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card className="border-none rounded-[32px] bg-white shadow-xl p-8 overflow-hidden">
              <CardContent className="p-0 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black uppercase text-slate-900">Horario de Atención</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400 uppercase">Tienda {formData.isOpen ? 'ABIERTA' : 'CERRADA'}</span>
                    <Switch checked={formData.isOpen} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOpen: checked }))} />
                  </div>
                </div>
                <div className="grid gap-3">
                  {operatingHours.map((hour, i) => (
                    <div key={hour.day} className={cn("flex items-center gap-2 p-3 rounded-[16px] bg-slate-50 min-w-0", !hour.enabled && "opacity-50")}>
                      <div className="w-[72px] shrink-0 min-w-0">
                        <span className="font-black text-xs uppercase text-slate-700 truncate block">{hour.day}</span>
                      </div>
                      <Switch checked={hour.enabled} onCheckedChange={(checked) => {
                        const newHours = [...operatingHours];
                        newHours[i].enabled = checked;
                        setOperatingHours(newHours);
                      }} />
                      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                        <Input type="time" value={hour.open} onChange={(e) => {
                          const newHours = [...operatingHours];
                          newHours[i].open = e.target.value;
                          setOperatingHours(newHours);
                        }} className="flex-1 min-w-0 h-9 rounded-[10px] bg-white border-none font-black text-center text-xs px-1" disabled={!hour.enabled} />
                        <span className="text-slate-400 font-black shrink-0">–</span>
                        <Input type="time" value={hour.close} onChange={(e) => {
                          const newHours = [...operatingHours];
                          newHours[i].close = e.target.value;
                          setOperatingHours(newHours);
                        }} className="flex-1 min-w-0 h-9 rounded-[10px] bg-white border-none font-black text-center text-xs px-1" disabled={!hour.enabled} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="washers">
            <Card className="border-none rounded-[32px] bg-white shadow-xl p-8">
              <CardContent className="p-0 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black uppercase text-slate-900">Tipos de Lavadoras</h3>
                  <Badge className="bg-primary text-white border-none">{formData.washerTypes.length} tipos</Badge>
                </div>
                <div className="grid gap-4">
                  {formData.washerTypes.map((washer) => (
                    <div key={washer.id} className="flex items-center justify-between p-4 rounded-[16px] bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-black text-lg text-slate-900 uppercase">{washer.name}</p>
                        <p className="text-xs text-slate-500 font-bold">{washer.description}</p>
                        <p className="text-primary font-black text-xl mt-1">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(washer.pricePerHour)}/hr
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeWasherType(washer.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed pt-6 space-y-4">
                  <p className="text-sm font-black text-slate-400 uppercase">Agregar nuevo tipo</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input value={newWasherType.name} onChange={(e) => setNewWasherType(prev => ({ ...prev, name: e.target.value }))} placeholder="Nombre (ej: Lavadora Premium)" className="h-12 rounded-[12px] bg-slate-50 border-none" />
                    <Input type="number" value={newWasherType.pricePerHour || ''} onChange={(e) => setNewWasherType(prev => ({ ...prev, pricePerHour: parseInt(e.target.value) || 0 }))} placeholder="Precio por hora" className="h-12 rounded-[12px] bg-slate-50 border-none" />
                    <Input value={newWasherType.description} onChange={(e) => setNewWasherType(prev => ({ ...prev, description: e.target.value }))} placeholder="Descripción breve" className="h-12 rounded-[12px] bg-slate-50 border-none" />
                  </div>
                  <Button onClick={addWasherType} className="bg-primary hover:bg-primary/90 rounded-[12px] font-black text-xs uppercase gap-2">
                    <Plus className="w-4 h-4" /> Agregar Tipo de Lavadora
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hora Mínima de Alquiler</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" value={formData.minRentalHours} onChange={(e) => setFormData(prev => ({ ...prev, minRentalHours: parseInt(e.target.value) || 1 }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black text-lg w-24 text-center" />
                      <span className="font-black text-slate-400 text-sm uppercase">horas</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Porcentaje de Comisión</Label>
                    <div className="flex items-center gap-2">
                      <Input type="number" step="0.01" min="0" max="1" value={formData.commissionRate} onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black text-lg w-24 text-center" />
                      <span className="font-black text-slate-400 text-sm uppercase">{(formData.commissionRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <Card className="border-none rounded-[32px] bg-white shadow-xl p-8">
              <CardContent className="p-0 space-y-8">
                <div className="flex items-center justify-between p-6 rounded-[20px] bg-slate-50">
                  <div>
                    <p className="font-black text-lg text-slate-900 uppercase">Servicio de Entrega</p>
                    <p className="text-xs text-slate-500">¿Ofreces entrega a domicilio?</p>
                  </div>
                  <Switch checked={formData.deliveryAvailable} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, deliveryAvailable: checked }))} />
                </div>
                {formData.deliveryAvailable && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Costo de Entrega</Label>
                    <Input type="number" value={formData.deliveryFee} onChange={(e) => setFormData(prev => ({ ...prev, deliveryFee: parseInt(e.target.value) || 0 }))} className="h-14 rounded-[16px] bg-slate-50 border-none font-black text-lg" />
                    <p className="text-xs text-slate-400">Costo adicional por entrega a domicilio</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="p-6 rounded-[20px] bg-primary/5 border border-primary/10">
                    <Users className="w-8 h-8 text-primary mb-3" />
                    <p className="font-black text-sm text-slate-700 uppercase">Repartidores Vinculados</p>
                    <p className="text-3xl font-black text-primary mt-2">{store.privateDrivers?.length || 0}</p>
                    <p className="text-xs text-slate-400 mt-1">Repartidores en tu flota</p>
                  </div>
                  <div className="p-6 rounded-[20px] bg-slate-50 border border-slate-100">
                    <BarChart3 className="w-8 h-8 text-slate-400 mb-3" />
                    <p className="font-black text-sm text-slate-700 uppercase">Código de Flota</p>
                    <p className="text-2xl font-black text-slate-900 mt-2 tracking-wider">{store.driverCode || 'Sin código'}</p>
                    <p className="text-xs text-slate-400 mt-1">Comparte este código</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}