'use client';

import { useEffect, useState } from 'react';
import { validateEnvironment } from '@/lib/env-validator';
import { XCircle } from 'lucide-react';

function hasValidKeys(): boolean {
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  
  return !!(mapsKey && mapsKey.startsWith('AIzaSy') && mapsKey.length > 20) &&
         !!(mapboxToken && mapboxToken.startsWith('pk.') && mapboxToken.length > 10);
}

export function SecurityValidator() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const hasKeys = hasValidKeys();
    
    if (!hasKeys) {
      const timer = setTimeout(() => setShouldShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (shouldShow) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-sm">
        <div className="bg-amber-900/90 border border-amber-600 rounded-lg p-3 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="text-amber-100 text-sm">
              ⚠️ Keys de API no configuradas. Edita <code className="bg-black/30 px-1 rounded">.env.local</code>
            </div>
            <button onClick={() => setShouldShow(false)}>
              <XCircle className="w-4 h-4 text-amber-300" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}