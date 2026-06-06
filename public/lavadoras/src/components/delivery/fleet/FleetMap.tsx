"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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

function createDriverElement(name: string, isSelected: boolean) {
  const el = document.createElement("div");
  el.className = "driver-marker";
  el.innerHTML = `
    <div style="
      width: 48px;
      height: 60px;
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    ">
      <div style="
        width: 40px;
        height: 40px;
        background: ${isSelected ? '#6a4ff9' : '#94a3b8'};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 3px solid white;
      ">
        <span style="
          color: white;
          font-weight: bold;
          font-size: 16px;
          font-family: sans-serif;
        ">${name.charAt(0).toUpperCase()}</span>
      </div>
      <div style="
        position: absolute;
        bottom: 0;
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 12px solid ${isSelected ? '#6a4ff9' : '#94a3b8'};
      "></div>
    </div>
  `;
  return el;
}

export function FleetMap({
  isOpen,
  onClose,
  drivers,
  config,
  mode = "fleet",
  onDriverSelect,
}: FleetMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLiveLocation | null>(null);
  const [eta, setEta] = useState<EtaInfo | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const defaultCenter: [number, number] = [-75.565, 6.247];

  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;
    let isMounted = true;

    async function initMap() {
      setIsLoading(true);
      setMapError(false);

      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        setMapError(true);
        setIsLoading(false);
        return;
      }

      mapboxgl.accessToken = mapboxToken;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const mapCenter = config?.center 
        ? [config.center.lng, config.center.lat] as [number, number]
        : defaultCenter;

      const map = new mapboxgl.Map({
        container: mapContainer.current as HTMLElement,
        style: "mapbox://styles/mapbox/navigation-day-v1",
        center: mapCenter,
        zoom: 14,
        attributionControl: true,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", () => {
        if (isMounted) {
          setIsMapReady(true);
          setIsLoading(false);
        }
      });

      map.on("error", () => {
        if (isMounted) {
          setMapError(true);
          setIsLoading(false);
        }
      });

      mapRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, config?.center]);

  const updateMarkers = useCallback(
    (driverList: DriverLiveLocation[]) => {
      if (!mapRef.current || !isMapReady) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      driverList.forEach((driver) => {
        if (!driver.currentLocation) return;

        const el = createDriverElement(driver.displayName || "?", selectedDriver?.id === driver.id);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([driver.currentLocation.lng, driver.currentLocation.lat])
          .addTo(mapRef.current!);

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div style="padding:8px;font-family:sans-serif;min-width:100px">
              <strong style="font-size:14px">${driver.displayName}</strong>
              <div style="font-size:12px;color:#64748b;margin-top:4px">En línea</div>
            </div>
          `);

        marker.setPopup(popup);

        marker.getElement().addEventListener("click", () => {
          setSelectedDriver(driver);
          onDriverSelect?.(driver);
          if (config?.destination && driver.currentLocation) {
            computeRouteForDriver(driver);
          }
        });

        popup.addTo(mapRef.current!);
        setTimeout(() => popup.remove(), 3000);

        markersRef.current.set(driver.id, marker);
      });

      if (drivers.length === 1 && drivers[0].currentLocation) {
        mapRef.current.flyTo({
          center: [drivers[0].currentLocation.lng, drivers[0].currentLocation.lat],
          zoom: 15,
          essential: true
        });
      }
    },
    [drivers, selectedDriver, config, onDriverSelect, isMapReady]
  );

  const computeRouteForDriver = useCallback(
    async (driver: DriverLiveLocation) => {
      if (!driver.currentLocation || !config?.destination || !mapRef.current || !isMapReady) return;

      const origin = [driver.currentLocation.lng, driver.currentLocation.lat] as [number, number];
      const destination = [config.destination.lng, config.destination.lat] as [number, number];

      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0];

          const duration = route.duration;
          const distance = route.distance;
          const hours = Math.floor(duration / 3600);
          const minutes = Math.floor((duration % 3600) / 60);
          const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${Math.round(duration / 60)} min`;
          const distanceKm = (distance / 1000).toFixed(1);
          const distanceText = `${distanceKm} km`;

          setEta({ duration, distance, durationText, distanceText });

          const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
            type: "Feature",
            properties: {},
            geometry: route.geometry
          };

          if (mapRef.current.getSource("driver-route")) {
            (mapRef.current.getSource("driver-route") as mapboxgl.GeoJSONSource).setData(geojson);
          } else {
            mapRef.current.addSource("driver-route", {
              type: "geojson",
              data: geojson
            });

            mapRef.current.addLayer({
              id: "driver-route",
              type: "line",
              source: "driver-route",
              layout: {
                "line-join": "round",
                "line-cap": "round"
              },
              paint: {
                "line-color": "#6a4ff9",
                "line-width": 5,
                "line-opacity": 0.75
              }
            });
          }

          const bounds = new mapboxgl.LngLatBounds(
            [Math.min(origin[0], destination[0]), Math.min(origin[1], destination[1])],
            [Math.max(origin[0], destination[0]), Math.max(origin[1], destination[1])]
          );
          mapRef.current.fitBounds(bounds, { padding: 80 });
        }
      } catch (err) {
        console.error("Error computing route:", err);
      }
    },
    [config, isMapReady]
  );

  useEffect(() => {
    if (isMapReady && drivers.length > 0) {
      updateMarkers(drivers);
    }
  }, [drivers, isMapReady, updateMarkers]);

  useEffect(() => {
    if (selectedDriver && config?.destination && selectedDriver.currentLocation) {
      computeRouteForDriver(selectedDriver);
    }
  }, [selectedDriver, config, computeRouteForDriver]);

  const handleOpenInMaps = useCallback((driver: DriverLiveLocation) => {
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
          <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
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
                <Button variant="ghost" size="icon" onClick={() => handleOpenInMaps(selectedDriver)}
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
                  if (driver.currentLocation && mapRef.current) {
                    mapRef.current.flyTo({
                      center: [driver.currentLocation.lng, driver.currentLocation.lat],
                      zoom: 15,
                      essential: true
                    });
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