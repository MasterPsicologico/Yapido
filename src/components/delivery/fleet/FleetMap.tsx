"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader,
  Navigation,
  Clock,
  User as UserIcon,
  Phone,
  MapPin,
  X,
  Layers,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { DriverLiveLocation } from "@/hooks/use-fleet-live-locations";
declare global {
  interface Window {
    google?: typeof google;
  }
}
interface MapConfig {
  center?: { lat: number; lng: number };
  zoom?: number;
  destination?: { lat: number; lng: number; address?: string };
  driverLocation?: { lat: number; lng: number };
  driverId?: string;
  driverName?: string;
}
interface FleetMapProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: DriverLiveLocation[];
  config?: MapConfig;
  mode?: "fleet" | "driver-route" | "customer-tracking";
  onDriverSelect?: (driver: DriverLiveLocation) => void;
}
interface EtaInfo {
  duration: number;
  distance: number;
  durationText: string;
  distanceText: string;
}

function createDriverIcon(name: string, isSelected: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 80;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = isSelected ? "#6a4ff9" : "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(32, 80);
  ctx.lineTo(6, 38);
  ctx.arc(32, 38, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name.charAt(0).toUpperCase(), 32, 38);
  return canvas.toDataURL();
}

async function getRoute(
  map: google.maps.Map,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<google.maps.DirectionsResult | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.DirectionsService) {
      resolve(null);
      return;
    }
    const service = new window.google.maps.DirectionsService();
    service.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) resolve(result);
        else resolve(null);
      }
    );
  });
}

export function FleetMap({
  isOpen,
  onClose,
  drivers,
  config,
  mode = "fleet",
  onDriverSelect,
}: FleetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const routeDisplayRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const routeServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLiveLocation | null>(null);
  const [eta, setEta] = useState<EtaInfo | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const defaultCenter = { lat: 6.247, lng: -75.565 };
  
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;
    let isMounted = true;
    let cleanupLoaded = false;
    
    async function initMap() {
      setIsLoading(true);
      setMapError(false);
      
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setMapError(true);
        setIsLoading(false);
        return;
      }
      
      if (!window.google?.maps) {
        if (!document.getElementById("google-maps-script")) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.id = "google-maps-script";
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3&libraries=marker`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
          }).catch(() => {
            if (isMounted) {
              setMapError(true);
              setIsLoading(false);
            }
            cleanupLoaded = true;
          });
          
          if (cleanupLoaded) return;
        }
        
        await new Promise<void>((resolve) => {
          if (window.google?.maps) { resolve(); return; }
          const check = setInterval(() => {
            if (window.google?.maps) {
              clearInterval(check);
              resolve();
            }
          }, 100);
          setTimeout(() => { clearInterval(check); resolve(); }, 5000);
        });
      }
      
      if (!isMounted || !mapRef.current) return;
      if (!window.google?.maps) {
        setMapError(true);
        setIsLoading(false);
        return;
      }
      
      const mapCenter = config?.center || defaultCenter;
      const map = new window.google.maps.Map(mapRef.current, {
        center: new window.google.maps.LatLng(mapCenter.lat, mapCenter.lng),
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        fullscreenControl: false,
        mapTypeControl: false,
        streetViewControl: false,
      });
      
      mapInstanceRef.current = map;
      routeServiceRef.current = new window.google.maps.DirectionsService();
      routeDisplayRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#6a4ff9",
          strokeOpacity: 0.75,
          strokeWeight: 5,
        },
      });
      setIsMapReady(true);
      setIsLoading(false);
    }
    
    initMap();
    
    return () => {
      isMounted = false;
      mapInstanceRef.current = null;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current.clear();
    };
  }, [isOpen]);
  const updateMarkers = useCallback(
    (driverList: DriverLiveLocation[]) => {
      const map = mapInstanceRef.current;
      if (!map || !isMapReady) return;
      markersRef.current.forEach((m) => { m.setMap(null); });
      markersRef.current.clear();
      driverList.forEach((driver) => {
        if (!driver.currentLocation) return;
        const pos = new window.google.maps.LatLng(driver.currentLocation.lat, driver.currentLocation.lng);
        const marker = new window.google.maps.Marker({
          position: pos,
          map,
          icon: {
            url: createDriverIcon(driver.displayName || "?", selectedDriver?.id === driver.id),
            scaledSize: new window.google.maps.Size(64, 80),
            anchor: new window.google.maps.Point(32, 70),
          },
          title: driver.displayName,
        });
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="padding:8px;font-family:sans-serif">
            <strong style="font-size:14px">${driver.displayName}</strong>
            <div style="font-size:12px;color:#64748b;margin-top:4px">En línea</div>
          </div>`,
        });
        marker.addListener("click", () => {
          setSelectedDriver(driver);
          onDriverSelect?.(driver);
          if (config?.destination && driver.currentLocation) {
            computeRouteForDriver(driver);
          }
        });
        infoWindow.open(map, marker);
        setTimeout(() => infoWindow.close(), 3000);
        markersRef.current.set(driver.id, marker);
      });
      if (drivers.length === 1 && drivers[0].currentLocation) {
        map.setCenter(new window.google.maps.LatLng(drivers[0].currentLocation.lat, drivers[0].currentLocation.lng));
      }
    },
    [drivers, selectedDriver, config, onDriverSelect, isMapReady]
  );
  const computeRouteForDriver = useCallback(
    async (driver: DriverLiveLocation) => {
      if (!routeServiceRef.current || !routeDisplayRef.current || !driver.currentLocation || !config?.destination) return;
      const result = await getRoute(mapInstanceRef.current!, driver.currentLocation, config.destination);
      if (result) {
        routeDisplayRef.current.setDirections(result);
        const route = result.routes[0]?.legs[0];
        if (route) {
          setEta({
            duration: route.duration?.value || 0,
            distance: route.distance?.value || 0,
            durationText: route.duration?.text || "?",
            distanceText: route.distance?.text || "?",
          });
        }
      }
    },
    [config]
  );
  useEffect(() => {
    if (isMapReady && drivers.length > 0) updateMarkers(drivers);
  }, [drivers, isMapReady, updateMarkers]);
  useEffect(() => {
    if (selectedDriver && config?.destination && selectedDriver.currentLocation) {
      computeRouteForDriver(selectedDriver);
    }
  }, [selectedDriver, config, computeRouteForDriver]);
  const handleOpenInGoogleMaps = useCallback((driver: DriverLiveLocation) => {
    if (!driver.currentLocation) return;
    if (config?.destination) {
      window.open(
        `https://www.google.com/maps/dir/${driver.currentLocation.lat},${driver.currentLocation.lng}/${config.destination.lat},${config.destination.lng}`,
        "_blank"
      );
    } else {
      window.open(
        `https://www.google.com/maps?q=${driver.currentLocation.lat},${driver.currentLocation.lng}`,
        "_blank"
      );
    }
  }, [config]);
  const handleCallDriver = useCallback((driver: DriverLiveLocation) => {
    if (!driver.phoneNumber) { toast({ title: "Sin teléfono", variant: "destructive" }); return; }
    window.open(`tel:${driver.phoneNumber}`, "_self");
  }, []);
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-white flex flex-col"
      >
        <div className="shrink-0 bg-slate-900 px-6 py-4 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter italic text-white leading-none">Mapa en Vivo</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                {drivers.length} repartidor{drivers.length !== 1 ? "es" : ""} activo{drivers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">EN VIVO</span>
            </div>
          </div>
        </div>
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Cargando mapa...</p>
            </div>
          )}
          {mapError && (
            <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center gap-4 z-10 p-8">
              <MapPin className="w-12 h-12 text-slate-200" />
              <p className="text-sm font-black text-slate-400 text-center">No se pudo cargar. Verifica la API key.</p>
            </div>
          )}
          {isMapReady && drivers.length === 0 && !isLoading && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl z-10">
              <p className="text-xs font-black text-center">No hay repartidores en línea</p>
            </div>
          )}
        </div>
        {selectedDriver && (
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            className="shrink-0 bg-white border-t border-slate-100 px-6 py-4 space-y-3 z-10"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-11 h-11 shadow-md">
                <AvatarImage src={selectedDriver.photoURL} />
                <AvatarFallback className="bg-primary text-white font-black text-sm">
                  {selectedDriver.displayName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-black text-sm">{selectedDriver.displayName}</p>
                {eta && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase px-2 h-5">
                      <Clock className="w-3 h-3 mr-1" />{eta.durationText}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] uppercase px-2 h-5">
                      <Navigation className="w-3 h-3 mr-1" />{eta.distanceText}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleCallDriver(selectedDriver)}
                  className="h-10 w-10 rounded-2xl bg-green-50 text-green-600 hover:bg-green-100">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleOpenInGoogleMaps(selectedDriver)}
                  className="h-10 w-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20">
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        <div className="shrink-0 bg-white border-t border-slate-100 px-4 py-3 overflow-x-auto z-10">
          <div className="flex items-center gap-2">
            {drivers.map((driver) => (
              <button
                key={driver.id}
                onClick={() => {
                  setSelectedDriver(driver);
                  if (driver.currentLocation && mapInstanceRef.current) {
                    mapInstanceRef.current.setCenter(new window.google.maps.LatLng(driver.currentLocation.lat, driver.currentLocation.lng));
                    mapInstanceRef.current.setZoom(15);
                  }
                  onDriverSelect?.(driver);
                }}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl transition-all",
                  selectedDriver?.id === driver.id ? "bg-primary text-white shadow-lg" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                <Avatar className="w-6 h-6 shadow">
                  <AvatarImage src={driver.photoURL} />
                  <AvatarFallback className={cn("text-[10px] font-black", selectedDriver?.id === driver.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600")}>
                    {driver.displayName?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {driver.displayName?.split(" ")[0]}
                </span>
                <div className={cn("w-1.5 h-1.5 rounded-full", driver.currentLocation ? "bg-green-400" : "bg-slate-300")} />
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}