
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Heart, Loader2, MessageCircle, Minus, Plus, CheckCircle2, Phone, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function ProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { profile } = useProfile();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [tempPhone, setTempPhone] = useState("");

  const productRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'products', id);
  }, [firestore, id]);

  const { data: product, isLoading } = useDoc(productRef);

  useEffect(() => {
    if (profile?.phoneNumber) {
      setTempPhone(profile.phoneNumber);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Cargando vitrina...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-slate-300 italic">404</h2>
            <p className="text-muted-foreground">Este producto ya no está en vitrina.</p>
            <Link href="/">
              <Button className="rounded-full bg-primary font-bold">Volver al Inicio</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const unitPrice = product?.price || 0;
  const totalPrice = unitPrice * quantity;

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(totalPrice);

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !product) {
      toast({ title: "Inicia sesión", description: "Debes estar logueado para realizar un pedido.", variant: "destructive" });
      return;
    }

    if (!tempPhone || tempPhone.trim().length < 10) {
      toast({ 
        title: "WhatsApp Requerido", 
        description: "Por favor ingresa tu número de WhatsApp para que la tienda te contacte.", 
        variant: "destructive" 
      });
      return;
    }

    setIsOrdering(true);
    try {
      // SISTEMA DE CURACIÓN DE DUEÑO
      let ownerId = product.storeOwnerId || product.ownerId;
      
      // Si el producto no tiene dueño (producto huérfano), intentamos buscar al dueño de la tienda
      if (!ownerId && product.storeId) {
        console.log("Intentando curación de producto huérfano...");
        const storeSnap = await getDoc(doc(firestore, 'stores', product.storeId));
        if (storeSnap.exists()) {
          ownerId = storeSnap.data().ownerId;
          // Reparamos el producto para el futuro de forma silenciosa
          updateDocumentNonBlocking(doc(firestore, 'products', product.id), { 
            storeOwnerId: ownerId,
            updatedAt: serverTimestamp() 
          });
        }
      }

      if (!ownerId) {
        toast({ 
          title: "Vendedor no identificado", 
          description: "Este producto no tiene un dueño asignado. Contacta al soporte.", 
          variant: "destructive" 
        });
        setIsOrdering(false);
        return;
      }

      // 2. Actualizar perfil del CLIENTE si es necesario
      if (tempPhone !== profile?.phoneNumber) {
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { 
          phoneNumber: tempPhone,
          updatedAt: serverTimestamp() 
        });
      }

      // 3. Crear el pedido
      const ordersRef = collection(firestore, 'orders');
      const orderData = {
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Cliente Vitriniando',
        customerPhone: tempPhone,
        storeId: product.storeId,
        storeName: product.storeName || 'Tienda Local',
        storeOwnerId: ownerId,
        productId: product.id,
        productName: product.name,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(ordersRef, orderData).catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: ordersRef.path,
            operation: 'create',
            requestResourceData: orderData,
          })
        );
        throw error;
      });

      setOrderConfirmed(true);
      toast({ 
        title: "¡Pedido Solicitado!", 
        description: "El vendedor ha sido notificado y te contactará por WhatsApp." 
      });
    } catch (e) {
      console.error("Order Error:", e);
      toast({ 
        title: "Error de Sistema", 
        description: "No se pudo procesar el pedido. Intenta de nuevo.", 
        variant: "destructive" 
      });
    } finally {
      setIsOrdering(false);
    }
  };

  const showPhoneInput = !profile?.phoneNumber || profile.phoneNumber.length < 10;

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Link 
          href={product?.storeId ? `/stores/${product.storeId}` : "/"} 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la Tienda
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-[40px] overflow-hidden shadow-xl shadow-slate-200/50 border border-white">
          <div className="relative aspect-square lg:aspect-auto lg:h-full bg-slate-100">
            <Image 
              src={product?.imageUrl || 'https://picsum.photos/seed/product/800/800'} 
              alt={product?.name || 'Producto'} 
              fill 
              className="object-cover"
              priority
            />
          </div>

          <div className="p-8 md:p-12 flex flex-col">
            <div className="mb-8 space-y-4">
              <Badge className="bg-secondary/10 text-secondary border-none uppercase tracking-[0.2em] text-[10px] font-black px-4 py-1 rounded-full">
                Vitriniando Pro
              </Badge>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tighter">
                {product?.name}
              </h1>
              <div className="flex flex-col gap-1">
                <span className="text-4xl font-black text-primary tracking-tighter">{formattedPrice}</span>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  Tienda: {product?.storeName || 'Negocio Local'}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Descripción</h3>
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                {product?.description}
              </p>
            </div>

            {orderConfirmed ? (
              <div className="bg-green-50 border border-green-100 p-6 rounded-3xl flex flex-col items-center text-center gap-3 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <h3 className="text-xl font-black text-green-900 italic">¡Pedido en Marcha!</h3>
                <p className="text-green-700 text-sm font-medium">Hemos registrado tu solicitud. El vendedor se pondrá en contacto pronto a tu WhatsApp.</p>
                <Link href="/admin/orders" className="mt-2 w-full">
                  <Button className="w-full rounded-full font-bold h-12">Ver mis Pedidos</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-auto space-y-6 pt-8 border-t border-slate-100">
                
                {showPhoneInput && (
                  <div className="space-y-3 bg-red-50 p-5 rounded-3xl border-2 border-red-500 shadow-xl shadow-red-100 animate-bounce-subtle">
                    <Label htmlFor="phone" className="text-[14px] font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> ¡TU WHATSAPP ES OBLIGATORIO!
                    </Label>
                    <Input 
                      id="phone"
                      type="tel"
                      placeholder="Ej: 300 123 4567"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      className="h-14 rounded-2xl border-none bg-white shadow-md font-black text-slate-800 focus:ring-4 focus:ring-red-200"
                    />
                    <p className="text-[10px] text-red-500 font-black uppercase italic leading-tight">
                      * El vendedor te escribirá por aquí para cerrar el negocio.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="text-sm font-black uppercase text-slate-400">Cantidad</span>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full h-10 w-10" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-black min-w-[20px] text-center">{quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full h-10 w-10" 
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={isOrdering}
                    size="lg" 
                    className="w-full h-16 rounded-full text-lg font-black gap-3 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  >
                    {isOrdering ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShoppingCart className="w-6 h-6" />}
                    Solicitar Pedido
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
