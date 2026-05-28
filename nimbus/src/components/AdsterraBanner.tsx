'use client';

import React, { useEffect, useRef } from 'react';

const AdsterraBanner = () => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const isScriptLoaded = useRef(false);

  useEffect(() => {
    // We want the script to re-run every time this component is rendered,
    // to ensure ads show up consistently when the component appears.
    // So, we don't check for isScriptLoaded.current anymore.
    const adContainer = adContainerRef.current;
    if (adContainer) {
      // Clear previous ad content to prevent script conflicts
      adContainer.innerHTML = '';
      
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.innerHTML = `
        atOptions = {
          'key' : '7cf524556128d26ab7e8cb4245f42a08',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = "https://www.highperformanceformat.com/7cf524556128d26ab7e8cb4245f42a08/invoke.js";
      invokeScript.async = true;
      
      adContainer.appendChild(configScript);
      adContainer.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="w-full flex justify-center overflow-hidden">
      <div 
        ref={adContainerRef} 
        style={{ 
          // Set a max-width to match the ad, but let it be flexible.
          // The container will be centered and won't exceed 320px.
          maxWidth: '320px', 
          height: '50px',
        }} 
      />
    </div>
  );
};

export default AdsterraBanner;
