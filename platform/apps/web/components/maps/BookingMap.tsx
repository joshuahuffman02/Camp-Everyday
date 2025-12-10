"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type MapSite = {
  id: string;
  name: string;
  siteNumber: string;
  status: "available" | "occupied" | "maintenance";
  statusDetail?: string | null;
  siteClassName?: string | null;
  maxOccupancy?: number;
  latitude?: number | null;
  longitude?: number | null;
  defaultRate?: number | null;
};

type Center = { latitude?: number | null; longitude?: number | null };

interface BookingMapProps {
  sites: MapSite[];
  campgroundCenter?: Center;
  selectedSiteId?: string;
  onSelectSite?: (siteId: string) => void;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<MapSite["status"], string> = {
  available: "#059669",
  occupied: "#f59e0b",
  maintenance: "#ef4444"
};

export function BookingMap({ sites, campgroundCenter, selectedSiteId, onSelectSite, isLoading }: BookingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);

  const fallbackCenter = useMemo<[number, number]>(() => {
    const lat = Number.isFinite(campgroundCenter?.latitude) ? Number(campgroundCenter?.latitude) : 39.8283; // US centroid
    const lng = Number.isFinite(campgroundCenter?.longitude) ? Number(campgroundCenter?.longitude) : -98.5795;
    return [lng, lat];
  }, [campgroundCenter]);

  const validSites = useMemo(() => {
    const jitter = 0.0004;
    const [fallbackLng, fallbackLat] = fallbackCenter;
    return sites
      .map((site, idx) => {
        const hasLat = Number.isFinite(site.latitude);
        const hasLng = Number.isFinite(site.longitude);
        const lat = hasLat
          ? Number(site.latitude)
          : (fallbackLat + jitter * Math.sin(idx));
        const lng = hasLng
          ? Number(site.longitude)
          : (fallbackLng + jitter * Math.cos(idx));
        return { ...site, latitude: lat, longitude: lng };
      })
      .filter((site) => Number.isFinite(site.latitude) && Number.isFinite(site.longitude));
  }, [sites, fallbackCenter]);

  const mapCenter = useMemo(() => {
    if (validSites.length > 0) {
      const first = validSites[0];
      return [Number(first.longitude), Number(first.latitude)] as [number, number];
    }
    return fallbackCenter;
  }, [validSites, fallbackCenter]);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: mapCenter,
      zoom: validSites.length > 0 ? 15 : 3,
      attributionControl: false
    });

    mapRef.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  }, [mapCenter, validSites.length]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: mapCenter, zoom: validSites.length > 0 ? 15 : 4, speed: 0.6 });
  }, [mapCenter, validSites.length]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    validSites.forEach((site) => {
      const el = document.createElement("button");
      el.className =
        "group relative rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500";
      el.style.width = "18px";
      el.style.height = "18px";
      el.style.backgroundColor = STATUS_COLORS[site.status];
      el.title = `${site.siteNumber} • ${site.status}`;

      if (onSelectSite) {
        el.addEventListener("click", () => onSelectSite(site.id));
      }

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([Number(site.longitude), Number(site.latitude)])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [validSites, onSelectSite]);

  useEffect(() => {
    if (!mapRef.current || !selectedSiteId) return;
    const site = validSites.find((s) => s.id === selectedSiteId);
    if (site) {
      mapRef.current.flyTo({
        center: [Number(site.longitude), Number(site.latitude)],
        zoom: 16,
        speed: 0.7
      });
    }
  }, [selectedSiteId, validSites]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div ref={containerRef} className="absolute inset-0" />

      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm text-slate-600">
          Loading map…
        </div>
      )}

      <div className="absolute left-3 bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-md bg-white/90 px-3 py-2 text-xs shadow">
        <span className="font-semibold text-slate-800">Legend</span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1 text-slate-600">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}

