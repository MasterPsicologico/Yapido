'use client';

import React, { useEffect, useRef } from 'react';

const AdsterraRectangle = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adContainer = adContainerRef.current;
    // Check if container exists and is empty to avoid duplicate scripts
    if (adContainer && adContainer.children.length === 0) {
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = {
          'key' : 'fbe4c87e280c34ba3f0cbc3309f208af',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = "https://www.highperformanceformat.com/fbe4c87e280c34ba3f0cbc3309f208af/invoke.js";
      invokeScript.async = true;
      
      adContainer.appendChild(configScript);
      adContainer.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="w-full flex justify-center items-center my-4 overflow-hidden">
      <div 
        ref={adContainerRef} 
        style={{ 
          width: '300px', 
          height: '250px',
          maxWidth: '100%',
        }} 
      />
    </div>
  );
};

export default AdsterraRectangle;
