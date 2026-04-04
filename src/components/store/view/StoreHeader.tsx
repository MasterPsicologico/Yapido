
"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreHeaderProps {
  imageUrl?: string;
  name?: string;
  mainCategoryId?: string;
  isOwner: boolean;
  updatingImage: string | null;
  onUpdateImage: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
  onOpenInfo: () => void;
}

export function StoreHeader({ 
  imageUrl, 
  name, 
  mainCategoryId, 
  isOwner, 
  updatingImage, 
  onUpdateImage, 
  onOpenInfo 
}: StoreHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [localImage, setLocalImage] = useState<string | null>(null);
  
  // CACHÉ INSTANTÁNEO DE CABECERA
  const CACHE_KEY = `vitriniando_store_header_${name?.replace(/\s/g, '_')}`;

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) setLocalImage(cached);
  }, [CACHE_KEY]);

  useEffect(() => {
    if (imageUrl && imageUrl !== localImage) {
      setLocalImage(imageUrl);
      localStorage.setItem(CACHE_KEY, imageUrl);
    }
  }, [imageUrl, localImage, CACHE_KEY]);

  const displayImage = localImage || imageUrl || 'https://picsum.photos/seed/bakery/1920/1080';

  return (
    <div className="relative h-[48vh] w-full">
      <Image 
        src={displayImage} 
        alt={name || 'Vitriniando'} 
        fill 
        className="object-cover" 
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
      
      {isOwner && (
        <div className="absolute top-6 right-6 z-30 flex gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => onUpdateImage(e, 'imageUrl')} 
          />
          <Button 
            onClick={onOpenInfo}
            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border border-white/30 h-11 px-4 gap-2 font-bold shadow-xl"
          >
            <Settings className="w-5 h-5" />
            Editar Info
          </Button>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={updatingImage === 'main'}
            className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border border-white/30 h-11 px-4 gap-2 font-bold shadow-xl"
          >
            {updatingImage === 'main' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          </Button>
        </div>
      )}

      <div className="absolute top-6 left-6 z-30">
        <Button 
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(mainCategoryId ? `/categories/${mainCategoryId}` : '/');
            }
          }}
          size="icon" 
          variant="secondary" 
          className="rounded-full bg-white/95 shadow-lg border-none w-11 h-11 transition-transform active:scale-90"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </Button>
      </div>
    </div>
  );
}
