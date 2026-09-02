import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { GeoJsonFeature } from '../lib/types';

interface Station {
  index: number;
  lat: number;
  lng: number;
  label: string;
}

interface LeafletMapProps {
  geojson?: GeoJsonFeature | any;
  mouza?: string;
  dagNo?: string;
  activeLayer?: string;
  areaDecimal?: number;
  landClass?: string;
  onStationSelect?: (st: Station) => void;
  className?: string;
}

const LAYER_TILES: Record<string, { url: string; attribution: string; maxZoom?: number }> = {
  bds: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors &middot; Bangladesh Digital Survey (BDS Cadastre)',
    maxZoom: 19,
  },
  sat: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics &middot; Satellite Orthophoto',
    maxZoom: 19,
  },
  bs: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap &middot; Humanitarian / BS Survey Sheet (2015)',
    maxZoom: 19,
  },
  rs: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap &middot; RS Cadastral Mouza Sheet Archive',
    maxZoom: 17,
  },
};

export default function LeafletMap({
  geojson,
  mouza = 'Tetuljhora',
  dagNo = '1204',
  activeLayer = 'bds',
  areaDecimal = 5.5,
  landClass = 'Homestead',
  onStationSelect,
  className = 'h-[440px] w-full',
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialCenter: [number, number] = [23.843, 90.2585];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 17,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: false, // Prevents intercepting the whole webpage scroll
    });

    const config = LAYER_TILES[activeLayer] || LAYER_TILES.bds;
    const tiles = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 19,
    }).addTo(map);

    tileLayerRef.current = tiles;
    markersGroupRef.current = L.layerGroup().addTo(map);
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

  // Update GeoJSON polygon and vertex station markers
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

    // Leaflet Polygon GeoJSON
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
            <strong style="font-size: 14px; color: #22456e;">দাগ নং ${dagNo}</strong><br/>
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
      marker.bindTooltip(`<b>${label}</b><br/>Lat: ${lat.toFixed(6)}°<br/>Lng: ${lng.toFixed(6)}°`, {
        direction: 'top',
        offset: [0, -10],
      });

      marker.on('click', () => {
        if (onStationSelect) {
          onStationSelect({ index: idx, lat, lng, label });
        }
      });

      if (markersGroupRef.current) {
        markersGroupRef.current.addLayer(marker);
      }
    });
  }, [geojson, mouza, dagNo, activeLayer, areaDecimal, landClass, onStationSelect]);

  return (
    <div className={`relative overflow-hidden border border-line ${className}`}>
      <div ref={mapContainerRef} className="h-full w-full bg-ground-sunk" />
      <div className="pointer-events-none absolute bottom-2 left-2 z-[400] rounded border border-line bg-sheet/90 px-2 py-1 text-2xs text-ink shadow-sm backdrop-blur-sm">
        <span className="font-semibold text-indigo">EPSG:4326 (WGS84)</span> &middot; Mouza {mouza} &middot; Plot {dagNo}
      </div>
    </div>
  );
}
