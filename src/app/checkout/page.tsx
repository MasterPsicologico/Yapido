
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  MessageCircle, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Truck,
  Zap
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, doc, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [tempPhone, setTempPhone] = useState("");
  const [tempAddress, setTempAddress] = useState("");

  useEffect(() => {
    if (profile?.phoneNumber) setTempPhone(profile.phoneNumber);
    if (profile?.address) setTempAddress(profile.address);
  }, [profile]);

  if (items.length === 0 && !orderId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <Zap className="w-16 h-16 text-slate-200" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Carrito Vacío</h2>
          <Button asChild className="rounded-full h-14 px-10 font-black"><Link href="/">Seguir Comprando</Link></Button>
        </div>
      </div>
    );
  }

  const handleCompleteOrder = async () => {
    if (!user || !firestore || items.length === 0) return;
    
    if (!tempPhone || tempPhone.length < 10) {
      toast({ title: "WhatsApp Requerido", description: "Es necesario para la entrega.", variant: "destructive" });
      return;
    }

    if (!tempAddress || tempAddress.length < 5) {
      toast({ title: "Dirección Requerida", description: "Dinos dónde entregamos tu pedido.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Tomamos la info de la tienda del primer ítem (asumiendo validación de tienda única en el contexto)
      const storeRef = doc(firestore, 'stores', items[0].storeId);
      const storeSnap = await getDoc(storeRef);
      const storeData = storeSnap.data();

      const orderData = {
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Cliente',
        customerPhone: tempPhone,
        customerAddress: tempAddress,
        storeId: items[0].storeId,
        storeName: items[0].storeName,
        storeOwnerId: storeData?.ownerId,
        storeAddress: storeData?.address || 'Tienda',
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl
        })),
        productName: items.length === 1 ? items[0].name : `${items[0].name} y ${items.length - 1} más`,
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isLogisticsPublic: false,
        participants: [user.uid, storeData?.ownerId].filter(Boolean)
      };

      const docRef = await addDoc(collection(firestore, 'orders'), orderData);
      
      // Actualizar perfil si los datos cambiaron
      const userRef = doc(firestore, 'users', user.uid);
      const updateData: any = {};
      if (tempPhone !== profile?.phoneNumber) updateData.phoneNumber = tempPhone;
      if (tempAddress !== profile?.address) updateData.address = tempAddress;
      if (Object.keys(updateData).length > 0) updateDocumentNonBlocking(userRef, updateData);

      setOrderId(docRef.id);
      clearCart();
      toast({ title: "¡Pedido Confirmado!", description: "La tienda ha recibido tu solicitud." });
    } catch (e: any) {
      toast({ title: "Error en Checkout", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (orderId) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-500 rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-green-200 mb-8">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-4 text-slate-900">¡Misión Cumplida!</h1>
          <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">
            Tu pedido ha sido enviado con éxito. Puedes seguir el estado en tiempo real desde tu panel de órdenes.
          </p>
          <div className="flex flex-col w-full max-w-xs gap-4">
            <Button asChild className="h-16 rounded-full bg-slate-900 font-black text-lg uppercase tracking-widest">
              <Link href="/admin/orders">Ver Mis Pedidos</Link>
            </Button>
            <Button asChild variant="ghost" className="h-14 font-bold text-slate-400">
              <Link href="/">Volver al Inicio</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Finalizar Pedido</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario de entrega */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none rounded-[32px] shadow-sm overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                      <MapPin className="w-5 h-5" />
                      <h3 className="font-black text-sm uppercase tracking-widest">Punto de Entrega</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección Exacta</Label>
                        <Input 
                          value={tempAddress} 
                          onChange={(e) => setTempAddress(e.target.value)}
                          placeholder="Ej: Calle 5 # 10-20, Barrio El Centro" 
                          className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp de Contacto</Label>
                        <div className="relative">
                          <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                          <Input 
                            value={tempPhone}
                            onChange={(e) => setTempPhone(e.target.value)}
                            placeholder="300 000 0000" 
                            className="h-14 rounded-2xl bg-slate-50 border-none pl-14 font-bold text-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t space-y-6">
                    <div className="flex items-center gap-3 text-slate-400">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="font-black text-sm uppercase tracking-widest">Método de Pago</h3>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-sm uppercase italic">Pago Contra Entrega</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Efectivo o Transferencia</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen del pedido */}
            <div className="space-y-6">
              <Card className="border-none rounded-[32px] shadow-2xl bg-slate-900 text-white overflow-hidden sticky top-24">
                <CardContent className="p-8 space-y-8">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter border-b border-white/10 pb-4">Resumen</h3>
                  
                  <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black bg-white/10 w-6 h-6 rounded flex items-center justify-center text-primary">{item.quantity}</span>
                          <span className="text-xs font-bold uppercase truncate max-w-[120px]">{item.name}</span>
                        </div>
                        <span className="text-xs font-black">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                      <span className="text-sm font-bold">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-primary">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Envío</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Por definir</span>
                    </div>
                    <div className="flex items-center justify-between pt-4">
                      <span className="text-lg font-black italic uppercase tracking-tighter">Total</span>
                      <span className="text-3xl font-black tracking-tighter text-primary">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCompleteOrder}
                    disabled={isProcessing}
                    className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg uppercase tracking-widest gap-3 shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <>PEDIR AHORA <ArrowRight className="w-5 h-5" /></>}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-white/30">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Compra Protegida por Vitriniando</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
