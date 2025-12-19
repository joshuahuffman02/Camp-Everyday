"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

type EditorSite = {
  id: string;
  name?: string | null;
  siteNumber?: string | null;
  mapLabel?: string | null;
};

type SiteMapData = {
  config?: any | null;
  sites?: Array<{ siteId: string; geometry: any; centroid?: any; label?: string | null; rotation?: number | null }>;
};

type SiteMapEditorProps = {
  campgroundId: string;
  mapData?: SiteMapData | null;
  baseImageUrl?: string | null;
  sites: EditorSite[];
  isLoading?: boolean;
  onSaved?: () => void;
  className?: string;
};

const isNumber = (value: any) => Number.isFinite(Number(value));

const normalizePoint = (value: any): Point | null => {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2 && isNumber(value[0]) && isNumber(value[1])) {
    return { x: Number(value[0]), y: Number(value[1]) };
  }
  if (typeof value === "object") {
    const x = value.x ?? value.lng ?? value.longitude;
    const y = value.y ?? value.lat ?? value.latitude;
    if (isNumber(x) && isNumber(y)) {
      return { x: Number(x), y: Number(y) };
    }
  }
  return null;
};

const extractPoints = (geometry: any): Point[] => {
  if (!geometry) return [];
  if (Array.isArray(geometry)) {
    return geometry.map(normalizePoint).filter(Boolean) as Point[];
  }
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates?.[0])) {
    return geometry.coordinates[0].map(normalizePoint).filter(Boolean) as Point[];
  }
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates?.[0]?.[0])) {
    return geometry.coordinates[0][0].map(normalizePoint).filter(Boolean) as Point[];
  }
  if (geometry.type === "LineString" && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates.map(normalizePoint).filter(Boolean) as Point[];
  }
  if (Array.isArray(geometry.points)) {
    return geometry.points.map(normalizePoint).filter(Boolean) as Point[];
  }
  if (Array.isArray(geometry.coords)) {
    return geometry.coords.map(normalizePoint).filter(Boolean) as Point[];
  }
  return [];
};

const extractRect = (geometry: any) => {
  if (!geometry || typeof geometry !== "object") return null;
  const x = geometry.x ?? geometry.left ?? geometry.minX;
  const y = geometry.y ?? geometry.top ?? geometry.minY;
  const width = geometry.width ?? (isNumber(geometry.right) && isNumber(x) ? Number(geometry.right) - Number(x) : null);
  const height = geometry.height ?? (isNumber(geometry.bottom) && isNumber(y) ? Number(geometry.bottom) - Number(y) : null);
  if (isNumber(x) && isNumber(y) && isNumber(width) && isNumber(height)) {
    return { x: Number(x), y: Number(y), width: Number(width), height: Number(height) };
  }
  return null;
};

const geometryToPoints = (geometry: any): Point[] => {
  const rect = extractRect(geometry);
  if (rect) {
    return [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.width, y: rect.y },
      { x: rect.x + rect.width, y: rect.y + rect.height },
      { x: rect.x, y: rect.y + rect.height }
    ];
  }
  return extractPoints(geometry);
};

const pointsToPath = (points: Point[], close = true) => {
  if (!points.length) return "";
  const parts = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`);
  return close ? `${parts.join(" ")} Z` : parts.join(" ");
};

const centroidFromPoints = (points: Point[]): Point | null => {
  if (points.length < 3) {
    if (points.length === 1) return points[0];
    if (points.length === 2) return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    return null;
  }
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i += 1) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const cross = p0.x * p1.y - p1.x * p0.y;
    area += cross;
    cx += (p0.x + p1.x) * cross;
    cy += (p0.y + p1.y) * cross;
  }
  if (area === 0) {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  }
  area *= 0.5;
  return { x: cx / (6 * area), y: cy / (6 * area) };
};

const getBoundsFromConfig = (bounds: any): Bounds | null => {
  if (!bounds) return null;
  if (Array.isArray(bounds) && bounds.length >= 4 && bounds.every(isNumber)) {
    return { minX: Number(bounds[0]), minY: Number(bounds[1]), maxX: Number(bounds[2]), maxY: Number(bounds[3]) };
  }
  const minX = bounds.minX ?? bounds.left ?? bounds.x;
  const minY = bounds.minY ?? bounds.top ?? bounds.y;
  const maxX = bounds.maxX ?? bounds.right ?? (isNumber(bounds.width) && isNumber(bounds.x) ? Number(bounds.x) + Number(bounds.width) : null);
  const maxY = bounds.maxY ?? bounds.bottom ?? (isNumber(bounds.height) && isNumber(bounds.y) ? Number(bounds.y) + Number(bounds.height) : null);
  if (isNumber(minX) && isNumber(minY) && isNumber(maxX) && isNumber(maxY)) {
    return { minX: Number(minX), minY: Number(minY), maxX: Number(maxX), maxY: Number(maxY) };
  }
  return null;
};

const roundPoint = (value: number) => Math.round(value * 100) / 100;

export function SiteMapEditor({
  campgroundId,
  mapData,
  baseImageUrl,
  sites,
  isLoading,
  onSaved,
  className
}: SiteMapEditorProps) {
  const { toast } = useToast();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [draftPoints, setDraftPoints] = useState<Point[]>([]);
  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [draftLayouts, setDraftLayouts] = useState<Record<string, { geometry: any; centroid?: any }>>({});

  useEffect(() => {
    if (!baseImageUrl) {
      setImageSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setImageSize({
        width: img.naturalWidth || img.width || 1000,
        height: img.naturalHeight || img.height || 1000
      });
    };
    img.onerror = () => setImageSize(null);
    img.src = baseImageUrl;
  }, [baseImageUrl]);

  useEffect(() => {
    if (!selectedSiteId) return;
    setIsDrawing(false);
    setDraftPoints([]);
    setHoverPoint(null);
  }, [selectedSiteId]);

  const existingLayouts = useMemo(() => {
    const map = new Map<string, { geometry: any; centroid?: any }>();
    (mapData?.sites ?? []).forEach((site) => {
      map.set(site.siteId, { geometry: site.geometry, centroid: site.centroid ?? undefined });
    });
    return map;
  }, [mapData?.sites]);

  const mergedLayouts = useMemo(() => {
    const map = new Map(existingLayouts);
    Object.entries(draftLayouts).forEach(([siteId, layout]) => {
      map.set(siteId, layout);
    });
    return map;
  }, [existingLayouts, draftLayouts]);

  const mappedSiteIds = useMemo(() => new Set(mergedLayouts.keys()), [mergedLayouts]);

  const filteredSites = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sites;
    return sites.filter((site) => {
      const label = `${site.siteNumber ?? ""} ${site.name ?? ""} ${site.mapLabel ?? ""}`.toLowerCase();
      return label.includes(term);
    });
  }, [search, sites]);

  const viewBox = useMemo(() => {
    if (imageSize) {
      return { minX: 0, minY: 0, width: imageSize.width, height: imageSize.height };
    }
    const configBounds = getBoundsFromConfig(mapData?.config?.bounds);
    if (configBounds) {
      return {
        minX: configBounds.minX,
        minY: configBounds.minY,
        width: configBounds.maxX - configBounds.minX,
        height: configBounds.maxY - configBounds.minY
      };
    }
    const points = Array.from(mergedLayouts.values()).flatMap((layout) => geometryToPoints(layout.geometry));
    if (points.length) {
      const minX = Math.min(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxX = Math.max(...points.map((p) => p.x));
      const maxY = Math.max(...points.map((p) => p.y));
      const width = maxX - minX || 100;
      const height = maxY - minY || 100;
      const pad = Math.max(width, height) * 0.04;
      return { minX: minX - pad, minY: minY - pad, width: width + pad * 2, height: height + pad * 2 };
    }
    return { minX: 0, minY: 0, width: 1000, height: 600 };
  }, [imageSize, mapData?.config?.bounds, mergedLayouts]);

  const selectedGeometry = selectedSiteId ? mergedLayouts.get(selectedSiteId)?.geometry : undefined;
  const selectedPoints = selectedGeometry ? geometryToPoints(selectedGeometry) : [];

  const draftLine = useMemo(() => {
    if (!isDrawing || draftPoints.length === 0) return "";
    const points = hoverPoint ? [...draftPoints, hoverPoint] : draftPoints;
    return pointsToPath(points, false);
  }, [draftPoints, hoverPoint, isDrawing]);

  const draftPolygon = useMemo(() => {
    if (!isDrawing || draftPoints.length < 3) return "";
    return pointsToPath(draftPoints, true);
  }, [draftPoints, isDrawing]);

  const getSvgPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * viewBox.width + viewBox.minX;
    const y = ((event.clientY - rect.top) / rect.height) * viewBox.height + viewBox.minY;
    return { x: roundPoint(x), y: roundPoint(y) };
  };

  const handleCanvasClick = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    if (!selectedSiteId) {
      toast({ title: "Select a site first", description: "Pick a site before drawing its boundary.", variant: "destructive" });
      return;
    }
    const point = getSvgPoint(event);
    if (!point) return;
    setDraftPoints((prev) => [...prev, point]);
  };

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const point = getSvgPoint(event);
    setHoverPoint(point);
  };

  const handleFinish = () => {
    if (!selectedSiteId) return;
    if (draftPoints.length < 3) {
      toast({ title: "Add at least 3 points", description: "Polygons need three or more points.", variant: "destructive" });
      return;
    }
    const geometry = {
      type: "Polygon",
      coordinates: [draftPoints.map((p) => [p.x, p.y])]
    };
    const centroid = centroidFromPoints(draftPoints);
    setDraftLayouts((prev) => ({
      ...prev,
      [selectedSiteId]: { geometry, centroid }
    }));
    setIsDrawing(false);
    setDraftPoints([]);
    setHoverPoint(null);
  };

  const handleUndo = () => {
    setDraftPoints((prev) => prev.slice(0, -1));
  };

  const handleClearDraft = () => {
    setDraftPoints([]);
    setHoverPoint(null);
  };

  const handleSave = async () => {
    if (!campgroundId) return;
    const entries = Object.entries(draftLayouts);
    if (!entries.length) {
      toast({ title: "No changes to save", description: "Draw a site boundary before saving." });
      return;
    }
    setSaving(true);
    try {
      const existingConfig = mapData?.config ?? {};
      const bounds = existingConfig.bounds ?? (imageSize ? [0, 0, imageSize.width, imageSize.height] : undefined);
      const configPayload = {
        bounds: bounds ?? null,
        defaultCenter: existingConfig.defaultCenter ?? null,
        defaultZoom: existingConfig.defaultZoom ?? null,
        layers: existingConfig.layers ?? null,
        legend: existingConfig.legend ?? null
      };

      const sitesPayload = entries.map(([siteId, payload]) => ({
        siteId,
        geometry: payload.geometry,
        centroid: payload.centroid
      }));

      await apiClient.upsertCampgroundMap(campgroundId, {
        config: configPayload,
        sites: sitesPayload
      });
      toast({ title: "Map saved", description: "Site boundaries updated." });
      setDraftLayouts({});
      onSaved?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save map";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500", className)}>
        Loading map editor...
      </div>
    );
  }

  if (!baseImageUrl) {
    return (
      <div className={cn("rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500", className)}>
        Upload a map image to enable polygon drawing.
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-slate-200 bg-white p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">Site map editor</div>
          <p className="text-xs text-slate-500">
            Select a site, click to drop polygon points, then finish and save.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsDrawing(true)} disabled={!selectedSiteId || isDrawing}>
            Draw polygon
          </Button>
          <Button size="sm" variant="outline" onClick={handleUndo} disabled={!isDrawing || draftPoints.length === 0}>
            Undo
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearDraft} disabled={!isDrawing || draftPoints.length === 0}>
            Clear
          </Button>
          <Button size="sm" onClick={handleFinish} disabled={!isDrawing}>
            Finish
          </Button>
          <Button size="sm" variant="default" onClick={handleSave} disabled={saving || Object.keys(draftLayouts).length === 0}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {Object.keys(draftLayouts).length > 0 && (
            <Badge variant="secondary">{Object.keys(draftLayouts).length} pending</Badge>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[260px,1fr]">
        <div className="space-y-3">
          <Input placeholder="Search sites" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="max-h-[420px] space-y-1 overflow-auto pr-1">
            {filteredSites.map((site) => {
              const isMapped = mappedSiteIds.has(site.id);
              const isActive = selectedSiteId === site.id;
              const label = site.siteNumber || site.name || site.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => setSelectedSiteId(site.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                    isActive ? "border-emerald-400 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{label}</span>
                    <span className="text-xs text-slate-500">{site.name}</span>
                  </div>
                  <Badge variant={isMapped ? "default" : "secondary"}>{isMapped ? "Mapped" : "Unmapped"}</Badge>
                </button>
              );
            })}
            {!filteredSites.length && (
              <div className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                No matching sites.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
          <svg
            ref={svgRef}
            viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
            className="h-[480px] w-full"
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoverPoint(null)}
            onClick={handleCanvasClick}
            role="img"
            aria-label="Site map editor canvas"
          >
            <image
              href={baseImageUrl}
              x={viewBox.minX}
              y={viewBox.minY}
              width={viewBox.width}
              height={viewBox.height}
              preserveAspectRatio="xMidYMid meet"
              opacity={0.95}
            />

            {Array.from(mergedLayouts.entries())
              .filter(([siteId]) => siteId !== selectedSiteId)
              .map(([siteId, layout]) => {
                const points = geometryToPoints(layout.geometry);
                if (points.length < 2) return null;
                return (
                  <path
                    key={siteId}
                    d={pointsToPath(points, true)}
                    fill="rgba(148,163,184,0.12)"
                    stroke="#94a3b8"
                    strokeWidth={1.2}
                  />
                );
              })}

            {selectedPoints.length >= 3 && (
              <path d={pointsToPath(selectedPoints, true)} fill="rgba(16,185,129,0.16)" stroke="#10b981" strokeWidth={2.4} />
            )}

            {draftPolygon && (
              <path d={draftPolygon} fill="rgba(59,130,246,0.2)" stroke="#2563eb" strokeWidth={2.2} />
            )}
            {draftLine && (
              <path d={draftLine} fill="none" stroke="#2563eb" strokeDasharray="4 3" strokeWidth={1.6} />
            )}
            {draftPoints.map((point, idx) => (
              <circle key={`${point.x}-${point.y}-${idx}`} cx={point.x} cy={point.y} r={3.2} fill="#2563eb" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}
