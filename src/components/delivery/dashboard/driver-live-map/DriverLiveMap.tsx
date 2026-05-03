"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Navigation, Clock, MapPin, Home, Phone, User, DollarSign, 
  ChevronUp, ChevronDown, Package, ArrowRight, Play, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDriverLocation, DriverLocationData } from "@/hooks/use-driver-location";
import { getFallbackCityConfig, DEFAULT_CITY_ID } from "@/lib/city-config";

interface OrderData {
  id: string;
  storeId?: string;
  storeName?: string;
  storeAddress: string;
  storeLocation?: { lat: number; lng: number };
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  customerLocation?: { lat: number; lng: number };
  customerSector?: string;
  totalPrice: number;
  paymentMethod?: string;
  status: string;
  washerType?: string;
  requestHours?: number;
  floor?: number;
  hasStairs?: boolean;
  stairCount?: number;
}

interface DriverLiveMapProps {
  order: OrderData;
  customerProfile?: any;
  isActive: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onClose: () => void;
  onUpdateStatus?: (status: string) => void;
  onOpenMaps?: (address: string) => void;
  onOpenChat?: () => void;
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

interface RouteInfo {
  duration: number;
  distance: number;
  durationText: string;
  distanceText: string;
}

export function DriverLiveMap({
  order,
  customerProfile,
  isActive,
  onStartTracking,
  onStopTracking,
  onClose,
  onUpdateStatus,
  onOpenMaps,
  onOpenChat,
}: DriverLiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [driverLocation, setDriverLocation] = useState<DriverLocationData | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const pickupLocation = order.storeLocation || getCoordinatesFromAddress(order.storeAddress);
  const deliveryLocation = order.customerLocation || getCoordinatesFromAddress(order.customerAddress);
  
  const cityConfig = getFallbackCityConfig(DEFAULT_CITY_ID);
  const defaultCenter = cityConfig.mapCenter;

  const { startTracking, stopTracking } = useDriverLocation({ enabled: isActive });

  useEffect(() => {
    if (isActive) {
      startTracking();
    } else {
      stopTracking();
    }
    return () => { stopTracking(); };
  }, [isActive, startTracking, stopTracking]);

  const fetchDriverLocation = useCallback(async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          timestamp: Date.now(),
          heading: pos.coords.heading || undefined,
          speed: pos.coords.speed || undefined,
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    if (isActive) {
      fetchDriverLocation();
      const interval = setInterval(fetchDriverLocation, 15000);
      return () => clearInterval(interval);
    }
  }, [isActive, fetchDriverLocation]);

  useEffect(() => {
    if (!mapRef.current || !order) return;
    
    const initMap = async () => {
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
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3&libraries=marker,geometry`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
          }).catch(() => {
            setMapError(true);
            setIsLoading(false);
          });
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
      
      if (!window.google?.maps || !mapRef.current) {
        setMapError(true);
        setIsLoading(false);
        return;
      }
      
      const map = new window.google.maps.Map(mapRef.current, {
        center: new window.google.maps.LatLng(defaultCenter.lat, defaultCenter.lng),
        zoom: 14,
        disableDefaultUI: false,
        zoomControl: true,
        fullscreenControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        draggable: true,
        scrollwheel: true,
      });
      
      mapInstanceRef.current = map;
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#6a4ff9",
          strokeOpacity: 0.8,
          strokeWeight: 5,
        },
        preserveViewport: false,
      });
      
      setIsMapReady(true);
      setIsLoading(false);
    };
    
    initMap();
    
    return () => {
      mapInstanceRef.current = null;
    };
  }, [order.id]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !isMapReady || !window.google?.maps) return;
    
    const map = mapInstanceRef.current;
    const markers: google.maps.Marker[] = [];
    
    if (pickupLocation) {
      const pickupMarker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(pickupLocation.lat, pickupLocation.lng),
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "Punto de recogida",
      });
      markers.push(pickupMarker);
    }
    
    if (deliveryLocation) {
      const deliveryMarker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(deliveryLocation.lat, deliveryLocation.lng),
        map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: "#22c55e",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "Punto de entrega",
      });
      markers.push(deliveryMarker);
    }
    
    if (driverLocation && isActive) {
      const driverMarker = new window.google.maps.Marker({
        position: new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng),
        map,
        icon: {
          path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
          fillColor: "#6a4ff9",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 1.5,
          anchor: new window.google.maps.Point(12, 24),
        },
        title: "Tu ubicación",
        zIndex: 1000,
      });
      markers.push(driverMarker);
      
      map.setCenter(new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng));
    }
    
    if (pickupLocation && deliveryLocation) {
      const origin = isActive && driverLocation 
        ? new window.google.maps.LatLng(driverLocation.lat, driverLocation.lng)
        : new window.google.maps.LatLng(pickupLocation.lat, pickupLocation.lng);
      
      const destination = new window.google.maps.LatLng(deliveryLocation.lat, deliveryLocation.lng);
      const waypoints = isActive && driverLocation 
        ? [{ location: new window.google.maps.LatLng(pickupLocation.lat, pickupLocation.lng), stopover: true }]
        : [];
      
      directionsServiceRef.current?.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRendererRef.current?.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            if (leg) {
              setCurrentRoute({
                duration: leg.duration?.value || 0,
                distance: leg.distance?.value || 0,
                durationText: leg.duration?.text || "?",
                distanceText: leg.distance?.text || "?",
              });
            }
          }
        }
      );
    }
    
    return () => {
      markers.forEach(m => m.setMap(null));
    };
  }, [pickupLocation, deliveryLocation, driverLocation, isActive, isMapReady]);

  useEffect(() => {
    if (isMapReady) {
      const cleanup = updateMarkers();
      return () => cleanup?.();
    }
  }, [isMapReady, updateMarkers]);

  useEffect(() => {
    if (isMapReady && driverLocation) {
      updateMarkers();
    }
  }, [driverLocation, isMapReady, updateMarkers]);

  const handleStartOrder = async () => {
    setIsStarting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onStartTracking();
    setIsStarting(false);
    toast({ title: "Ruta iniciada", description: "Seguimiento en tiempo real activado", className: "bg-green-600 text-white" });
  };

  const isPickingUp = order.status === "picking_up" || order.status === "at_store";

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900 flex flex-col"
    >
      <div className="shrink-0 bg-slate-900/95 backdrop-blur-md px-4 py-3 flex items-center justify-between safe-area-top border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-base font-black uppercase tracking-tight italic text-white leading-none">
              {isPickingUp ? "Recoger Lavadora" : "Entregar al Cliente"}
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Pedido #{order.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">EN VIVO</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Cargando mapa...</p>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-10 p-8">
            <MapPin className="w-12 h-12 text-slate-600" />
            <p className="text-sm font-black text-slate-500 text-center">No se pudo cargar el mapa</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full">
              Reintentar
            </Button>
          </div>
        )}

        {currentRoute && isActive && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-4 left-4 right-4 z-10"
          >
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between border border-white/10 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Tiempo estimado</p>
                  <p className="text-sm font-black text-white">{currentRoute.durationText}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Distancia</p>
                  <p className="text-sm font-black text-white">{currentRoute.distanceText}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="absolute bottom-32 left-4 right-4 z-10 flex justify-center">
          {!isActive && (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              onClick={handleStartOrder}
              disabled={isStarting}
              className="bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest px-6 py-3 rounded-full shadow-lg shadow-primary/30 flex items-center gap-2"
            >
              {isStarting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              Iniciar Ruta
            </motion.button>
          )}
        </div>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="shrink-0 bg-slate-900 border-t border-white/10 rounded-t-3xl overflow-hidden"
      >
        <button
          onClick={() => setIsCardExpanded(!isCardExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50"
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isPickingUp ? "bg-blue-500" : "bg-green-500"
            )} />
            <span className="text-sm font-black text-white uppercase">
              {isPickingUp ? "Recoger" : "Entregar"}
            </span>
          </div>
          {isCardExpanded ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {isCardExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4 space-y-4 bg-slate-900">
                {isPickingUp && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-black text-blue-400 uppercase">Punto de Recogida</span>
                    </div>
                    <p className="text-sm font-bold text-white">{order.storeName || "Tienda"}</p>
                    <p className="text-xs text-slate-400 mt-1">{order.storeAddress}</p>
                    <Button 
                      onClick={() => onOpenMaps?.(order.storeAddress)}
                      className="mt-3 w-full h-10 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 font-black text-xs uppercase gap-2"
                    >
                      <Navigation className="w-4 h-4" />
                      Abrir en Maps
                    </Button>
                  </div>
                )}

                <div className={cn(
                  "border rounded-2xl p-4",
                  isPickingUp ? "bg-green-500/10 border-green-500/20" : "bg-primary/10 border-primary/20"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {isPickingUp ? (
                      <Home className="w-4 h-4 text-green-500" />
                    ) : (
                      <Package className="w-4 h-4 text-primary" />
                    )}
                    <span className={cn(
                      "text-xs font-black uppercase",
                      isPickingUp ? "text-green-400" : "text-primary"
                    )}>
                      {isPickingUp ? "Punto de Entrega" : "Cliente"}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white">{order.customerName}</p>
                  <p className="text-xs text-slate-400 mt-1">{order.customerAddress}</p>
                  {order.customerSector && (
                    <p className="text-[10px] text-slate-500 uppercase mt-1">{order.customerSector}</p>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      onClick={() => onOpenMaps?.(order.customerAddress)}
                      className={cn(
                        "flex-1 h-10 rounded-xl font-black text-xs uppercase gap-2",
                        isPickingUp 
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                          : "bg-primary/20 text-primary hover:bg-primary/30"
                      )}
                    >
                      <Navigation className="w-4 h-4" />
                      Maps
                    </Button>
                    {order.customerPhone && (
                      <Button 
                        onClick={() => window.open(`tel:${order.customerPhone}`, "_self")}
                        variant="ghost"
                        className="h-10 px-4 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase">Detalles del Pedido</span>
                    <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] uppercase">
                      {order.washerType || "Lavadora"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Total</p>
                      <p className="text-lg font-black text-white">{formatPrice(order.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">Horas</p>
                      <p className="text-lg font-black text-white">{order.requestHours || 5}h</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 uppercase">Pago:</span>
                      <span className={cn(
                        "text-xs font-black uppercase",
                        order.paymentMethod === "cash" ? "text-yellow-400" : "text-blue-400"
                      )}>
                        {order.paymentMethod === "cash" ? "Efectivo" : "Digital"}
                      </span>
                    </div>
                    {order.floor && (
                      <span className="text-[10px] text-slate-400">
                        Piso {order.floor} {order.hasStairs && `• ${order.stairCount} pisos`}
                      </span>
                    )}
                  </div>
                </div>

                {onUpdateStatus && (
                  <Button
                    onClick={() => onUpdateStatus(isPickingUp ? "at_destination" : "delivered")}
                    className={cn(
                      "w-full h-12 rounded-2xl font-black text-sm uppercase tracking-widest gap-2",
                      isPickingUp 
                        ? "bg-blue-500 hover:bg-blue-600 text-white" 
                        : "bg-green-500 hover:bg-green-600 text-white"
                    )}
                  >
                    {isPickingUp ? (
                      <>
                        <ArrowRight className="w-5 h-5" />
                        Confirmar Recogida
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-5 h-5" />
                        Confirmar Entrega
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="px-4 py-3 bg-slate-900 flex items-center justify-between border-t border-white/5">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={customerProfile?.photoURL} />
              <AvatarFallback className="bg-slate-700 text-white text-xs font-black">
                {order.customerName?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xs font-black text-white">{order.customerName}</p>
              <p className="text-[9px] text-slate-500">{formatPrice(order.totalPrice)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order.customerPhone && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => window.open(`tel:${order.customerPhone}`, "_self")}
                className="h-9 w-9 rounded-xl bg-green-500/10 text-green-400 hover:bg-green-500/20"
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}
            {onOpenChat && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onOpenChat}
                className="h-9 w-9 rounded-xl bg-primary/10 text-primary hover:bg-primary/20"
              >
                <User className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getCoordinatesFromAddress(address: string): { lat: number; lng: number } | null {
  const DEFAULT_CITY_CENTER = { lat: 6.247, lng: -75.565 };
  if (!address) return DEFAULT_CITY_CENTER;
  return null;
}