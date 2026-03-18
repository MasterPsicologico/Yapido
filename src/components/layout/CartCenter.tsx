
"use client";

import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function CartCenter() {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, isCartOpen, setIsCartOpen } = useCart();

  const formattedTotal = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(totalPrice);

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-8 w-8 sm:h-9 sm:w-9">
          <ShoppingCart className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", totalItems > 0 ? "text-primary" : "text-slate-400")} />
          {totalItems > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-none shadow-2xl">
        <SheetHeader className="p-6 border-b bg-white">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <ShoppingCart className="w-5 h-5" />
              </div>
              Tu Pedido
            </SheetTitle>
            <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[10px] uppercase px-3">{totalItems} ítems</Badge>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {items.length === 0 ? (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                <PackageX className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-xl italic uppercase text-slate-400">Carrito Vacío</h3>
                <p className="text-slate-400 text-sm max-w-[200px]">Explora las vitrinas y añade algo delicioso.</p>
              </div>
              <SheetClose asChild>
                <Button className="rounded-full bg-primary font-black px-8">Empezar a Vitrinear</Button>
              </SheetClose>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {/* Encabezado de tienda */}
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Comprando en</p>
                  <p className="text-sm font-black italic uppercase text-slate-800">{items[0].storeName}</p>
                </div>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="group relative flex gap-4 p-2 rounded-2xl transition-all hover:bg-slate-50">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-black text-sm italic uppercase text-slate-900 leading-tight line-clamp-1">{item.name}</h4>
                        <p className="text-primary font-black text-xs mt-1">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(item.price)}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-full h-8 px-1 gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
              <Button asChild className="w-full h-16 rounded-[24px] bg-primary text-white font-black text-lg gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
                <Link href="/checkout">
                  FINALIZAR COMPRA <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </SheetClose>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
