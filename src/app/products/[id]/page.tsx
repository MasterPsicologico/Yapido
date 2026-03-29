
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Loader2, Minus, Plus, CheckCircle2, AlertCircle, UserCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

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

  const productRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'products', id), [firestore, id]);
  const { data: product, isLoading } = useDoc(productRef);

  const hasPhone = !!profile?.phoneNumber;

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !product) return;
    
    if (!hasPhone) {
      toast({ 
        title: "Perfil Incompleto", 
        description: "Debes registrar tu WhatsApp en tu perfil antes de pedir.", 
        variant: "destructive" 
      });
      router.push('/profile');
      return;
    }

    setIsOrdering(true);
    try {
      const storeSnap = await getDoc(doc(firestore, 'stores', product.storeId));
      const storeData = storeSnap.data();
      
      let storePhone = storeData?.phoneNumber || '';
      if (!storePhone && storeData?.ownerId) {
        const ownerSnap = await getDoc(doc(firestore, 'users', storeData.ownerId));
        if (ownerSnap.exists()) {
          storePhone = ownerSnap.data().phoneNumber || '';
        }
      }
      
      const orderData = {
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Cliente',
        customerPhone: profile?.phoneNumber,
        customerAddress: profile?.address || 'Por definir',
        storeId: product.storeId,
        storeName: product.storeName,
        storeOwnerId: storeData?.ownerId || product.storeOwnerId,
        storeAddress: storeData?.address || 'Ubicación de tienda',
        storePhone: storePhone,
        productId: product.id,
        productName: product.name,
        quantity,
        items: [{
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: quantity,
          imageUrl: product.imageUrl
        }],
        totalPrice: product.price * quantity,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isLogisticsPublic: false,
        participants: [user.uid, storeData?.ownerId || product.storeOwnerId]
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      
      setOrderConfirmed(true);
      toast({ title: "¡Pedido Enviado!" });
    } catch (e: any) {
      toast({ title: "Error al solicitar", description: e.message || "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setIsOrdering(false); 
    }
  };

  if (isLoading) return (
    <div className="flex flex-col min-h-screen"><Navbar /><div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div></div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <Link href={`/stores/${product?.storeId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver a Vitrina
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-[40px] overflow-hidden shadow-xl border border-white">
          <div className="relative aspect-square">
            {product?.imageUrl && <Image src={product.imageUrl} alt={product.name || 'Producto'} fill className="object-cover" />}
          </div>
          <div className="p-8 flex flex-col">
            <Badge className="bg-primary/10 text-primary border-none uppercase text-[10px] font-black px-4 py-1 rounded-full w-fit mb-4">Vitriniando Pro</Badge>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-2">{product?.name}</h1>
            <span className="text-4xl font-black text-primary tracking-tighter mb-8">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product?.price || 0)}
            </span>

            {orderConfirmed ? (
              <div className="bg-green-50 p-8 rounded-3xl text-center space-y-4 animate-in zoom-in">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-2xl font-black text-green-900">¡Pedido Solicitado!</h3>
                <p className="text-green-700 font-medium">El vendedor te contactará por WhatsApp en los próximos minutos.</p>
                <Button asChild className="rounded-full w-full h-12 shadow-lg"><Link href="/admin/orders">Ver mis Pedidos</Link></Button>
              </div>
            ) : (
              <div className="mt-auto space-y-6">
                {!hasPhone && (
                  <div className="bg-slate-50 p-5 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center gap-2">
                    <UserCircle className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                      Completa tu perfil con un número de contacto para poder comprar.
                    </p>
                    <Button variant="link" asChild className="text-primary font-black text-xs uppercase p-0 h-auto">
                      <Link href="/profile">Completar Perfil</Link>
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="font-black text-slate-400 text-xs">CANTIDAD</span>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="w-4 h-4" /></Button>
                    <span className="text-xl font-black">{quantity}</span>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePlaceOrder} 
                  disabled={isOrdering || !hasPhone} 
                  className="w-full h-16 rounded-full text-xl font-black bg-primary shadow-xl gap-3 disabled:grayscale disabled:opacity-50"
                >
                  {isOrdering ? <Loader2 className="w-6 h-6 animate-spin" /> : <><ShoppingCart /> Solicitar Pedido</>}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
