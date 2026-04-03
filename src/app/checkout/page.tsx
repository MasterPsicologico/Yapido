
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ArrowRight,
  MapPin, 
  CreditCard, 
  MessageCircle, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Truck,
  Tag,
  Wallet,
  Globe,
  X,
  UserCircle,
  Sparkles
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, doc, serverTimestamp, addDoc, getDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { orchestrateOrder } from '@/ai/flows/order-orchestrator';
import { AgentProgressOverlay } from '@/components/agents/AgentProgressOverlay';

export default function CheckoutPage() {
  const { items, totalPrice: cartSubtotal, clearCart } = useCart();
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [tempAddress, setTempAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // ESTADO DE LA CIUDADELA
  const [isAgentWorking, setIsAgentWorking] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [agentError, setAgentError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.address) setTempAddress(profile.address);
  }, [profile]);

  const hasPhone = !!profile?.phoneNumber;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (cartSubtotal * appliedCoupon.value) / 100;
    }
    return appliedCoupon.value;
  }, [appliedCoupon, cartSubtotal]);

  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !firestore) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(
        collection(firestore, 'coupons'), 
        where('code', '==', couponCode.toUpperCase()),
        where('active', '==', true),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ title: "Cupón inválido", description: "El código no existe o expiró.", variant: "destructive" });
        setAppliedCoupon(null);
      } else {
        const couponData = snap.docs[0].data();
        if (cartSubtotal < (couponData.minOrderValue || 0)) {
          toast({ 
            title: "Monto insuficiente", 
            description: `Compra mínima: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(couponData.minOrderValue)}`, 
            variant: "destructive" 
          });
          return;
        }
        setAppliedCoupon({ ...couponData, id: snap.docs[0].id });
        toast({ title: "¡Cupón Aplicado!", description: "El descuento ha sido inyectado." });
      }
    } catch (e) {
      toast({ title: "Error", description: "No se pudo validar el cupón.", variant: "destructive" });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!user || !firestore || items.length === 0) return;
    
    if (!hasPhone) {
      toast({ title: "Perfil Incompleto", description: "Registra tu número en tu perfil.", variant: "destructive" });
      router.push('/profile');
      return;
    }

    if (!tempAddress || tempAddress.length < 5) {
      toast({ title: "Dirección Requerida", description: "Dinos dónde entregamos tu pedido.", variant: "destructive" });
      return;
    }

    // ACTIVACIÓN DE LA CIUDADELA
    setIsAgentWorking(true);
    setAgentLogs([]);
    setAgentError(null);

    try {
      // 1. INVOCAR AL ORQUESTADOR DE AGENTES
      const orchestratorResult = await orchestrateOrder({
        userId: user.uid,
        cartItems: items,
        address: tempAddress,
        paymentMethod: paymentMethod,
        storeId: items[0].storeId,
        totalPrice: finalTotal,
        customerName: profile?.displayName || user.displayName || 'Cliente',
        customerPhone: profile?.phoneNumber
      });

      setAgentLogs(orchestratorResult.agentLogs);

      if (!orchestratorResult.success) {
        setAgentError(orchestratorResult.error || "Fallo en la sincronización de agentes.");
        setTimeout(() => setIsAgentWorking(false), 3000);
        return;
      }

      // 2. OBTENER DATOS DE TIENDA Y GUARDAR ORDEN (PERSISTENCIA)
      const storeRef = doc(firestore, 'stores', items[0].storeId);
      const storeSnap = await getDoc(storeRef);
      const storeData = storeSnap.data();

      const ownerId = storeData?.ownerId || '';
      const participants = [user.uid, ownerId].filter(id => id && typeof id === 'string');

      const orderData = {
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Cliente',
        customerPhone: profile?.phoneNumber,
        customerAddress: tempAddress,
        storeId: items[0].storeId,
        storeName: items[0].storeName,
        storeOwnerId: ownerId,
        storeAddress: storeData?.address || 'Tienda',
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          imageUrl: i.imageUrl
        })),
        productName: items.length === 1 ? items[0].name : `${items[0].name} y ${items.length - 1} más`,
        subtotal: cartSubtotal,
        discountAmount: discountAmount,
        totalPrice: finalTotal,
        paymentMethod: paymentMethod,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isLogisticsPublic: true, // ¡CAMBIO CLAVE! Hacerlo público inmediatamente
        participants: participants,
        // METADATOS INYECTADOS POR IA
        agentMetadata: (orchestratorResult as any).data
      };

      const docRef = await addDoc(collection(firestore, 'orders'), orderData);
      
      const userRef = doc(firestore, 'users', user.uid);
      if (tempAddress !== profile?.address) {
        updateDocumentNonBlocking(userRef, { address: tempAddress, updatedAt: serverTimestamp() });
      }

      // 3. FINALIZACIÓN EXITOSA
      setTimeout(() => {
        setOrderId(docRef.id);
        clearCart();
        setIsAgentWorking(false);
        toast({ title: "¡Pedido Confirmado!", description: "La IA de Vitriniando ha procesado tu solicitud." });
      }, 1500);

    } catch (e: any) {
      setAgentError(e.message);
      setTimeout(() => setIsAgentWorking(false), 3000);
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
            Tu pedido ha sido procesado por la Ciudadela de Agentes. Puedes seguir el estado en tiempo real.
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
      
      {/* OVERLAY DE INTELIGENCIA ARTIFICIAL */}
      <AgentProgressOverlay 
        isOpen={isAgentWorking} 
        logs={agentLogs} 
        isError={!!agentError} 
        errorMsg={agentError || ''} 
      />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Finalizar Pedido</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none rounded-[32px] shadow-sm overflow-hidden bg-white">
                <CardContent className="p-8 space-y-10">
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
                      
                      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">WhatsApp Registrado</p>
                            <p className="text-sm font-black text-slate-800">{profile?.phoneNumber || 'No registrado'}</p>
                          </div>
                        </div>
                        {!hasPhone && (
                          <Button variant="ghost" size="sm" asChild className="text-primary font-black text-[10px] uppercase">
                            <Link href="/profile">REGISTRAR</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t space-y-6">
                    <div className="flex items-center gap-3 text-slate-400">
                      <CreditCard className="w-5 h-5" />
                      <h3 className="font-black text-sm uppercase tracking-widest">Método de Pago</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setPaymentMethod('cash')}
                        className={cn(
                          "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                          paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-slate-100 bg-slate-50"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", paymentMethod === 'cash' ? "bg-primary text-white" : "bg-white text-slate-400")}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-xs uppercase italic">Contra Entrega</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efectivo / Transferencia</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('digital')}
                        className={cn(
                          "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                          paymentMethod === 'digital' ? "border-secondary bg-secondary/5" : "border-slate-100 bg-slate-50"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", paymentMethod === 'digital' ? "bg-secondary text-white" : "bg-white text-slate-400")}>
                          <Globe className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-xs uppercase italic">Pago Online</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tarjeta / PSE / Billetera</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="pt-8 border-t space-y-6">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Tag className="w-5 h-5" />
                      <h3 className="font-black text-sm uppercase tracking-widest">¿Tienes un Cupón?</h3>
                    </div>
                    {appliedCoupon ? (
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-black text-xs uppercase text-green-700 italic">Cupón "{appliedCoupon.code}" Aplicado</p>
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">
                              Descuento de {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setAppliedCoupon(null)} className="text-green-700 hover:bg-green-100 rounded-full">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          placeholder="CÓDIGO" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="h-12 rounded-xl bg-slate-50 border-none font-black text-center tracking-[0.2em]"
                        />
                        <Button 
                          onClick={handleValidateCoupon}
                          disabled={isValidatingCoupon || !couponCode}
                          className="h-12 px-6 rounded-xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest shrink-0"
                        >
                          {isValidatingCoupon ? <Loader2 className="animate-spin" /> : "APLICAR"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none rounded-[32px] shadow-2xl bg-slate-900 text-white overflow-hidden sticky top-24">
                <CardContent className="p-8 space-y-8">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter border-b border-white/10 pb-4">Resumen</h3>
                  
                  <div className="space-y-4 max-h-[250px] overflow-y-auto no-scrollbar">
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
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cartSubtotal)}
                      </span>
                    </div>
                    
                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-green-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Descuento</span>
                        <span className="text-sm font-bold">
                          -{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-primary">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Envío</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest italic">A cargo de tienda</span>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <span className="text-lg font-black italic uppercase tracking-tighter">Total</span>
                      <span className="text-3xl font-black tracking-tighter text-primary">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(finalTotal)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCompleteOrder}
                    disabled={isProcessing || !hasPhone || isAgentWorking}
                    className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg uppercase tracking-widest gap-3 shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:scale-[1.02] transition-all disabled:grayscale disabled:opacity-50"
                  >
                    {isAgentWorking ? <Loader2 className="animate-spin" /> : <>PEDIR AHORA <ArrowRight className="w-5 h-5" /></>}
                  </Button>
                  
                  {!hasPhone && (
                    <p className="text-[9px] text-center text-red-400 font-black uppercase tracking-widest animate-pulse">
                      Debes completar tu perfil para pedir
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center gap-2 text-white/30">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">IA de Vitriniando Activa</span>
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
