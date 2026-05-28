'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

export default function AdPlaceholder() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adContainer = adRef.current;
    if (!adContainer) return;

    // Evitar duplicados si el componente se re-renderiza
    if (adContainer.querySelector('script')) {
      return;
    }

    const scriptConfig = document.createElement('script');
    scriptConfig.type = 'text/javascript';
    scriptConfig.innerHTML = `
      atOptions = {
        'key' : 'cc328dea93ebf914ea639eba1a040c12',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    const scriptInvoke = document.createElement('script');
    scriptInvoke.type = 'text/javascript';
    scriptInvoke.src = "https://www.highperformanceformat.com/cc328dea93ebf914ea639eba1a040c12/invoke.js";
    scriptInvoke.async = true;

    adContainer.appendChild(scriptConfig);
    adContainer.appendChild(scriptInvoke);

  }, []);

  return (
    <div className="w-full flex justify-center">
        <div 
            ref={adRef}
            className="ad-container"
            style={{ width: '468px', height: '60px' }}
        >
        </div>
    </div>
  );
}
