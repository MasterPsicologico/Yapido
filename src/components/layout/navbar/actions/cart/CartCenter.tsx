
"use client";

import { ShoppingCart, ArrowRight, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartTrigger } from './CartTrigger';
import { CartItem } from './CartItem';

export function CartCenter() {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, isCartOpen, setIsCartOpen } = useCart();
  const formattedTotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice);

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <CartTrigger totalItems={totalItems} />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none shadow-2xl">
        <SheetHeader className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><ShoppingCart className="w-5 h-5" /></div>
              Tu Pedido
            </SheetTitle>
            <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase px-3">{totalItems} ítems</Badge>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6">
          {items.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
              <PackageX className="w-20 h-20 text-slate-200 bg-slate-50 rounded-full p-5" />
              <div className="space-y-1">
                <h3 className="font-black text-xl italic uppercase text-slate-400">Carrito Vacío</h3>
                <p className="text-slate-400 text-sm max-w-[200px]">Explora las vitrinas y añade algo delicioso.</p>
              </div>
              <SheetClose asChild><Button className="rounded-full bg-primary font-black px-8">Empezar a Vitrinear</Button></SheetClose>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
                <ArrowRight className="w-8 h-8 p-2 bg-white rounded-lg shadow-sm text-primary" />
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Comprando en</p><p className="text-sm font-black italic uppercase text-slate-800">{items[0].storeName}</p></div>
              </div>
              <div className="space-y-4">
                {items.map(i => <CartItem key={i.id} item={i} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />)}
              </div>
            </div>
          )}
        </ScrollArea>
        {items.length > 0 && (
          <SheetFooter className="p-6 bg-white border-t sm:flex-col gap-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total del Pedido</span>
              <span className="text-2xl font-black italic text-slate-900 tracking-tighter">{formattedTotal}</span>
            </div>
            <SheetClose asChild>
              <Button asChild className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg gap-3 shadow-xl hover:scale-[1.02] transition-all">
                <Link href="/checkout">FINALIZAR COMPRA <ArrowRight className="w-5 h-5" /></Link>
              </Button>
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
