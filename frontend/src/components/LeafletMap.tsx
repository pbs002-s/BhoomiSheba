import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoJsonFeature } from '../lib/types';

interface Station {
  index: number;
  lat: number;
  lng: number;
  label: string;
  btm?: string;
}

export interface MeasureResult {
  pointsCount: number;
  totalMeters: number;
  totalFeet: number;
  totalGaj: number;
  totalLinks: number;
  areaSqFt?: number;
  areaDecimal?: number;
  areaKatha?: number;
}

interface LeafletMapProps {
  geojson?: GeoJsonFeature | any;
  mouza?: string;
  dagNo?: string;
  activeLayer?: string;
  areaDecimal?: number;
  landClass?: string;
  isMeasuring?: boolean;
  adjacentParcels?: import('../lib/types').AdjacentParcel[];
  onStationSelect?: (st: Station) => void;
  onMeasureUpdate?: (res: MeasureResult | null) => void;
  className?: string;
}

const LAYER_TILES: Record<string, { url: string; attribution: string; maxZoom?: number }> = {
  bds: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap &middot; Bangladesh Digital Survey (BDS Cadastre 2026)',
    maxZoom: 19,
  },
  sat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar &middot; High-Resolution Satellite Orthophoto',
    maxZoom: 19,
  },
  bs: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; Humanitarian OSM &middot; BS Survey Sheet (2015 Digitized)',
    maxZoom: 19,
  },
  rs: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap &middot; RS Revisional Survey Cadastral Sheet (1984)',
    maxZoom: 17,
  },
  cs: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; National Geographic / DLRS Historical Archive &middot; CS Cadastre (1924)',
    maxZoom: 16,
  },
};


import { toBTM, toLinks, toGaj, toFeet } from '../lib/format';
import { gsap, prefersReducedMotion } from '../lib/gsap';

export default function LeafletMap({
  geojson,
  mouza = 'Tetuljhora',
  dagNo = '1204',
  activeLayer = 'bds',
  areaDecimal = 5.5,
  landClass = 'Homestead',
  isMeasuring = false,
  adjacentParcels = [],
  onStationSelect,
  onMeasureUpdate,
  className = 'h-[440px] w-full',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const adjacentGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const measureGroupRef = useRef<L.LayerGroup | null>(null);

  const measurePointsRef = useRef<L.LatLng[]>([]);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = [23.843, 90.2585];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false,
    });

    const config = LAYER_TILES[activeLayer] || LAYER_TILES.bds;
    const tiles = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 19,
    }).addTo(map);

    tileLayerRef.current = tiles;
    adjacentGroupRef.current = L.layerGroup().addTo(map);
    markersGroupRef.current = L.layerGroup().addTo(map);
    measureGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer when activeLayer changes
  useEffect(() => {
    if (!mapRef.current) return;
    const config = LAYER_TILES[activeLayer] || LAYER_TILES.bds;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const newTiles = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 19,
    }).addTo(mapRef.current);
    tileLayerRef.current = newTiles;
  }, [activeLayer]);

  // Update GeoJSON polygon, adjacent plots, and vertex station markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean previous layers
    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }
    if (adjacentGroupRef.current) {
      adjacentGroupRef.current.clearLayers();
    }

    let coords: number[][] = [];
    if (geojson?.geometry?.coordinates?.[0]?.length >= 3) {
      coords = geojson.geometry.coordinates[0];
    } else {
      coords = [
        [90.2581, 23.8432],
        [90.2592, 23.8435],
        [90.2595, 23.8427],
        [90.2583, 23.8424],
        [90.2581, 23.8432],
      ];
    }

    // Render Adjacent Plots if provided
    if (adjacentParcels && adjacentParcels.length > 0) {
      // Offset coords slightly to create adjacent polygons
      const adj1Coords = [
        [coords[0][0] - 0.0011, coords[0][1] + 0.0007],
        [coords[1][0] - 0.0004, coords[1][1] + 0.0008],
        [coords[1][0], coords[1][1]],
        [coords[0][0], coords[0][1]],
        [coords[0][0] - 0.0011, coords[0][1] + 0.0007],
      ];

      const adj2Coords = [
        [coords[3][0], coords[3][1]],
        [coords[2][0], coords[2][1]],
        [coords[2][0] + 0.0005, coords[2][1] - 0.0008],
        [coords[3][0] - 0.0002, coords[3][1] - 0.0009],
        [coords[3][0], coords[3][1]],
      ];

      const adjLayers = [
        {
          coords: adj1Coords,
          meta: adjacentParcels[0] || { dagNo: '1203', encroachmentStatus: 'VARIANCE_FLAG', owner: 'Neighbor' },
          color: '#e07a70',
        },
        {
          coords: adj2Coords,
          meta: adjacentParcels[1] || { dagNo: '1205', encroachmentStatus: 'CLEAR', owner: 'Adjacent Owner' },
          color: '#86adda',
        },
      ];

      adjLayers.forEach(({ coords: c, meta, color }) => {
        const poly = L.polygon(
          c.map((pt) => [pt[1], pt[0]] as [number, number]),
          {
            color,
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: color,
            fillOpacity: 0.1,
          }
        );
        poly.bindTooltip(
          `<b>দাগ নং ${meta.dagNo} (পাশ্ববর্তী প্লট)</b><br/>মালিক: ${meta.owner}<br/>` +
            (meta.encroachmentStatus === 'VARIANCE_FLAG'
              ? '<span style="color:#e07a70;font-weight:bold;">⚠️ সীমানা বিরোধ / ০.০২ শতক ওভারল্যাপ সম্ভাব্য</span>'
              : '<span style="color:#4fbf95;">✓ সীমানা সুনির্দিষ্ট</span>')
        );
        adjacentGroupRef.current?.addLayer(poly);
      });
    }

    // Leaflet Main Polygon GeoJSON
    const polygonFeature: GeoJSON.Feature = {
      type: 'Feature',
      properties: {
        mouza,
        dagNo,
        areaDecimal,
        landClass,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [coords],
      },
    };

    const isSatellite = activeLayer === 'sat';
    const geoLayer = L.geoJSON(polygonFeature, {
      style: {
        color: isSatellite ? '#00f0ff' : '#22456e',
        weight: 3,
        opacity: 0.95,
        fillColor: isSatellite ? '#00f0ff' : '#22456e',
        fillOpacity: isSatellite ? 0.22 : 0.16,
        dashArray: '5, 5',
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; color: #14181a;">
            <strong style="font-size: 14px; color: #22456e;">দাগ নং ${dagNo} (নির্বাচিত প্লট)</strong><br/>
            <span>মৌজা: ${mouza}</span><br/>
            <span>রেকর্ডকৃত জমি: <b>${areaDecimal} শতক</b> (${landClass})</span><br/>
            <span style="font-size: 11px; color: #666;">BDS 2026 Drone RTK GNSS Cadastral Vector</span>
          </div>
        `);
      },
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;

    // Fit map bounds to the parcel polygon
    const bounds = geoLayer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 18 });
    }

    // Add survey station benchmark node markers at each polygon vertex
    const uniqueCoords = coords.slice(
      0,
      coords.length > 3 && coords[0][0] === coords[coords.length - 1][0] ? -1 : undefined
    );

    const stationLabels = ['NW Station', 'NE Station', 'SE Station', 'SW Station', 'ST-5', 'ST-6'];

    uniqueCoords.forEach(([lng, lat], idx) => {
      const label = stationLabels[idx] || `ST-${idx + 1}`;
      const btm = toBTM(lat, lng);

      const iconHtml = `
        <div style="
          width: 22px;
          height: 22px;
          background: ${isSatellite ? '#00f0ff' : '#22456e'};
          color: ${isSatellite ? '#000' : '#fff'};
          border: 2px solid #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          font-size: 10px;
          font-weight: bold;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          cursor: pointer;
        ">
          ${idx + 1}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'cadastral-station-icon',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindTooltip(
        `<b>${label} (জরিপ স্তম্ভ #${idx + 1})</b><br/>` +
          `WGS84: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°<br/>` +
          `<span style="color:#22456e;font-weight:bold;">BTM: ${btm.formatted}</span>`,
        {
          direction: 'top',
          offset: [0, -10],
        }
      );

      marker.on('click', () => {
        if (onStationSelect) {
          onStationSelect({ index: idx, lat, lng, label, btm: btm.formatted });
        }
      });

      if (!prefersReducedMotion()) {
        marker.on('add', () => {
          const pin = marker.getElement()?.firstElementChild;
          if (!pin) return;
          gsap.fromTo(
            pin,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2.5)', delay: idx * 0.06 }
          );
        });
      }

      if (markersGroupRef.current) {
        markersGroupRef.current.addLayer(marker);
      }
    });
  }, [geojson, mouza, dagNo, activeLayer, areaDecimal, landClass, adjacentParcels, onStationSelect]);

  // Handle Measurement Interaction
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isMeasuring) {
      measureGroupRef.current?.clearLayers();
      measurePointsRef.current = [];
      if (onMeasureUpdate) onMeasureUpdate(null);
      return;
    }

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const pt = e.latlng;
      measurePointsRef.current.push(pt);
      const pts = measurePointsRef.current;

      measureGroupRef.current?.clearLayers();

      // Draw pins
      pts.forEach((p, idx) => {
        const pin = L.circleMarker(p, {
          radius: 5,
          color: '#a8322a',
          fillColor: '#ffffff',
          fillOpacity: 1,
          weight: 2,
        });
        measureGroupRef.current?.addLayer(pin);
      });

      // Calculate distances
      let totalMeters = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        totalMeters += pts[i].distanceTo(pts[i + 1]);
      }

      // Draw polyline
      if (pts.length >= 2) {
        const poly = L.polyline(pts, {
          color: '#a8322a',
          weight: 2.5,
          dashArray: '4, 4',
        });
        measureGroupRef.current?.addLayer(poly);
      }

      // Calculate enclosed area if 3+ points
      let areaSqFt: number | undefined;
      let areaDecimalVal: number | undefined;
      let areaKathaVal: number | undefined;

      if (pts.length >= 3) {
        // Approximate planar area in meters
        let a = 0;
        const n = pts.length;
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const p1 = map.latLngToLayerPoint(pts[i]);
          const p2 = map.latLngToLayerPoint(pts[j]);
          a += p1.x * p2.y - p2.x * p1.y;
        }
        // Conversion factor based on current scale
        const p0 = map.latLngToLayerPoint(pts[0]);
        const pEast = map.layerPointToLatLng(L.point(p0.x + 100, p0.y));
        const pNorth = map.layerPointToLatLng(L.point(p0.x, p0.y - 100));
        const mEast = pts[0].distanceTo(pEast) / 100;
        const mNorth = pts[0].distanceTo(pNorth) / 100;
        const areaSqM = (Math.abs(a) / 2) * mEast * mNorth;

        areaSqFt = areaSqM * 10.7639;
        areaDecimalVal = areaSqFt / 435.6;
        areaKathaVal = areaDecimalVal / 1.65;

        const closedPoly = L.polygon(pts, {
          color: '#a8322a',
          fillColor: '#a8322a',
          fillOpacity: 0.15,
          weight: 1,
        });
        measureGroupRef.current?.addLayer(closedPoly);
      }

      if (onMeasureUpdate) {
        onMeasureUpdate({
          pointsCount: pts.length,
          totalMeters: Math.round(totalMeters * 10) / 10,
          totalFeet: toFeet(totalMeters),
          totalGaj: toGaj(totalMeters),
          totalLinks: toLinks(totalMeters),
          areaSqFt: areaSqFt ? Math.round(areaSqFt) : undefined,
          areaDecimal: areaDecimalVal ? Number(areaDecimalVal.toFixed(2)) : undefined,
          areaKatha: areaKathaVal ? Number(areaKathaVal.toFixed(2)) : undefined,
        });
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isMeasuring, onMeasureUpdate]);

  return (
    <div className={`relative overflow-hidden border border-line ${className}`}>
      <div
        ref={mapContainerRef}
        className={`h-full w-full bg-ground-sunk ${isMeasuring ? 'cursor-crosshair' : ''}`}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded border border-line bg-sheet/90 px-2 py-1 text-2xs text-ink shadow-sm backdrop-blur-sm">
        <span className="font-semibold text-indigo">EPSG:4326 / BTM</span> &middot; Mouza {mouza} &middot; Plot {dagNo}
      </div>
      {isMeasuring && (
        <div className="absolute right-2 top-2 z-[400] flex items-center gap-2 rounded border border-line bg-sheet/95 px-3 py-1.5 shadow-md">
          <span className="h-2 w-2 animate-ping rounded-full bg-seal" />
          <span className="text-2xs font-semibold text-seal">মাপজোখ মোড সক্রিয় — ম্যাপে ক্লিক করুন</span>
          <button
            type="button"
            onClick={() => {
              measureGroupRef.current?.clearLayers();
              measurePointsRef.current = [];
              if (onMeasureUpdate) onMeasureUpdate(null);
            }}
            className="rounded border border-line bg-ground px-1.5 py-0.5 text-2xs font-medium text-ink hover:bg-ground-sunk"
          >
            মুছুন
          </button>
        </div>
      )}
    </div>
  );
}

