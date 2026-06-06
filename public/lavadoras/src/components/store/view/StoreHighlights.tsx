
"use client";

import Image from 'next/image';
import { Edit2, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface StoreHighlightsProps {
  highlights?: string[];
  isOwner: boolean;
  updatingImage: string | null;
  onUpdateHighlight: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
}

export function StoreHighlights({ highlights, isOwner, updatingImage, onUpdateHighlight }: StoreHighlightsProps) {
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const images = highlights || [
    `https://picsum.photos/seed/h1/300/300`,
    `https://picsum.photos/seed/h2/300/300`,
    `https://picsum.photos/seed/h3/300/300`
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      <input 
        type="file" 
        ref={highlightInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => activeIdx !== null && onUpdateHighlight(e, activeIdx)} 
      />
      {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-[22px] overflow-hidden shadow-sm group">
              <Image src={img} alt={`Destacado ${i}`} fill className="object-cover" />
              {isOwner && (
                <button 
                  onClick={() => { setActiveIdx(i); highlightInputRef.current?.click(); }}
                  disabled={updatingImage === `highlight-${i}`}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  {updatingImage === `highlight-${i}` ? <Loader2 className="w-6 h-6 animate-spin" /> : <Edit2 className="w-6 h-6" />}
                </button>
              )}
          </div>
      ))}
    </div>
  );
}
