'use client';

import * as React from 'react';

export type DeviceSize = 'mobile' | 'tablet' | 'desktop';

const TABLET_BREAKPOINT = 768;
const DESKTOP_BREAKPOINT = 1280;

export function useDeviceSize(): DeviceSize {
  const [deviceSize, setDeviceSize] = React.useState<DeviceSize>('mobile');

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width >= DESKTOP_BREAKPOINT) {
        setDeviceSize('desktop');
      } else if (width >= TABLET_BREAKPOINT) {
        setDeviceSize('tablet');
      } else {
        setDeviceSize('mobile');
      }
    };

    checkDevice();
    
    const mqlTablet = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`);
    const mqlDesktop = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    
    const onChange = () => checkDevice();
    
    mqlTablet.addEventListener('change', onChange);
    mqlDesktop.addEventListener('change', onChange);
    
    return () => {
      mqlTablet.removeEventListener('change', onChange);
      mqlDesktop.removeEventListener('change', onChange);
    };
  }, []);

  return deviceSize;
}

export function useIsMobile(): boolean {
  return useDeviceSize() === 'mobile';
}

export function useIsTablet(): boolean {
  return useDeviceSize() === 'tablet';
}

export function useIsDesktop(): boolean {
  return useDeviceSize() === 'desktop';
}

export const DEVICE_BREAKPOINTS = {
  mobile: TABLET_BREAKPOINT - 1,
  tablet: DESKTOP_BREAKPOINT - 1,
  desktop: DESKTOP_BREAKPOINT,
} as const;