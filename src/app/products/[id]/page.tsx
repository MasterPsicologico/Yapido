
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowLeft, Loader2, Minus, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

  const productRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'products', id), [firestore, id]);
  const { data: product, isLoading } = useDoc(productRef);

  useEffect(() => {
    if (profile?.phoneNumber) setTempPhone(profile.phoneNumber);
  }, [profile]);

  const handlePlaceOrder = async () => {
    if (!user || !firestore || !product) return;
    if (!tempPhone || tempPhone.length < 10) {
      toast({ title: "WhatsApp Requerido", description: "Es necesario para la entrega.", variant: "destructive" });
      return;
    }

    setIsOrdering(true);
    try {
      // Garantizar que tenemos el ownerId del negocio
      let ownerId = product.storeOwnerId;
      if (!ownerId) {
        const storeSnap = await getDoc(doc(firestore, 'stores', product.storeId));
        ownerId = storeSnap.data()?.ownerId;
      }

      if (!ownerId) {
        throw new Error("No se pudo identificar al dueño del negocio.");
      }

      // Obtener la dirección actual del perfil para estamparla en el pedido
      const customerAddress = profile?.address || (profile?.addresses && profile.addresses[0]) || '';
      
      const orderData = {
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Cliente',
        customerPhone: tempPhone,
        customerAddress: customerAddress, // DIRECCIÓN REAL DETECTADA
        storeId: product.storeId,
        storeName: product.storeName,
        storeOwnerId: ownerId,
        productId: product.id,
        productName: product.name,
        quantity,
        totalPrice: product.price * quantity,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // ARQUITECTURA DE SEGURIDAD: Campo participantes para indexado query-safe
        participants: [user.uid, ownerId],
        isLogisticsPublic: false
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      
      if (tempPhone !== profile?.phoneNumber) {
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { phoneNumber: tempPhone });
      }

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
                <div className="space-y-3 bg-red-50 p-5 rounded-3xl border-2 border-red-500">
                  <Label className="text-xs font-black uppercase text-red-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> TU WHATSAPP ES OBLIGATORIO</Label>
                  <Input type="tel" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="h-12 rounded-2xl bg-white border-none font-black" placeholder="Ej: 300 123 4567" />
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                  <span className="font-black text-slate-400 text-xs">CANTIDAD</span>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="w-4 h-4" /></Button>
                    <span className="text-xl font-black">{quantity}</span>
                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setQuantity(quantity + 1)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <Button onClick={handlePlaceOrder} disabled={isOrdering} className="w-full h-16 rounded-full text-xl font-black bg-primary shadow-xl gap-3">
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
