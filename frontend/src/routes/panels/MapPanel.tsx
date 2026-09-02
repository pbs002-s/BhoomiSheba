import { useState, useMemo } from 'react';
import { Layers, Copy, Check, Compass, Radio, MapPin, Grid } from 'lucide-react';
import type { Parcel } from '../../lib/types';
import ParcelPlate from '../../components/ParcelPlate';
import LeafletMap from '../../components/LeafletMap';
import { DataRow, Panel, StatusMark } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { decimals, katha, sqft } from '../../lib/format';

interface LayerOption {
  id: string;
  bn: string;
  en: string;
  meta: string;
  tone: 'state' | 'indigo' | 'amber';
  mark: string;
  description: string;
}

const LAYERS: LayerOption[] = [
  {
    id: 'bds',
    bn: 'বিডিএস ২০২৬ ড্রোন ভেক্টর',
    en: 'BDS 2026 Drone GIS Vector',
    meta: 'PostGIS · EPSG:4326',
    tone: 'indigo',
    mark: 'Active (সক্রিয়)',
    description: 'High-precision RTK GNSS drone cadastral vector layer with exact boundary vertex nodes.',
  },
  {
    id: 'sat',
    bn: 'স্যাটেলাইট অর্থোফটো বেসম্যাপ',
    en: 'Satellite Orthophoto',
    meta: 'High-res aerial raster',
    tone: 'amber',
    mark: 'Composite',
    description: 'Aerial satellite imagery overlay for ground physical feature comparison.',
  },
  {
    id: 'bs',
    bn: 'বিএস জরিপ (ডিজিটাইজড)',
    en: 'BS Survey Sheet (Vectorised)',
    meta: '2015 · sheet 04',
    tone: 'state',
    mark: 'Aligned',
    description: 'Digitized vector polygon from the authoritative BS 2015 cadastral field survey.',
  },
  {
    id: 'rs',
    bn: 'আরএস মৌজা নকশা',
    en: 'RS Mouza Cadastral Sheet',
    meta: '1988 · scanned archive',
    tone: 'state',
    mark: 'Archived',
    description: 'Georeferenced raster sheet from the 1988 Revisional Survey.',
  },
];

interface StationNode {
  label: string;
  lat: string;
  lng: string;
  rawLat: number;
  rawLng: number;
}

export default function MapPanel({ parcel }: { parcel: Parcel }) {
  const [activeLayer, setActiveLayer] = useState<string>('bds');
  const [viewMode, setViewMode] = useState<'leaflet' | 'plate'>('leaflet');
  const [selectedStationInfo, setSelectedStationInfo] = useState<{ label: string; lat: number; lng: number } | null>(null);
  const [copiedStation, setCopiedStation] = useState<string | null>(null);

  // Extract true vertex coordinates from GeoJSON
  const stations: StationNode[] = useMemo(() => {
    const coords = parcel.geojsonBoundary?.geometry?.coordinates?.[0] as number[][] | undefined;
    if (coords && coords.length >= 3) {
      const unique = coords.slice(0, coords.length > 3 && coords[0][0] === coords[coords.length - 1][0] ? -1 : undefined);
      const labels = ['NW Station', 'NE Station', 'SE Station', 'SW Station', 'Station 5', 'Station 6'];
      return unique.map((pt: number[], i: number) => ({
        label: labels[i] || `ST-${i + 1}`,
        lat: Number(pt[1]).toFixed(5),
        lng: Number(pt[0]).toFixed(5),
        rawLat: pt[1],
        rawLng: pt[0],
      }));
    }
    return [
      { label: 'NW Station', lat: '23.8432', lng: '90.2581', rawLat: 23.8432, rawLng: 90.2581 },
      { label: 'NE Station', lat: '23.8435', lng: '90.2592', rawLat: 23.8435, rawLng: 90.2592 },
      { label: 'SE Station', lat: '23.8427', lng: '90.2595', rawLat: 23.8427, rawLng: 90.2595 },
      { label: 'SW Station', lat: '23.8424', lng: '90.2583', rawLat: 23.8424, rawLng: 90.2583 },
    ];
  }, [parcel]);

  const gap =
    parcel.mappedAreaDecimal !== undefined
      ? Math.abs(parcel.mappedAreaDecimal - parcel.areaDecimal)
      : 0;

  const handleCopyCoord = (st: (typeof stations)[0]) => {
    navigator.clipboard.writeText(`${st.lat}, ${st.lng}`);
    setCopiedStation(st.label);
    setTimeout(() => setCopiedStation(null), 2000);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
      <Reveal>
        <Panel
          label="Cadastral Vector Map"
          meta={`মৌজা ${parcel.mouza} · দাগ ${parcel.dagNo}`}
          action={
            <div className="flex items-center gap-3">
              <div className="flex rounded border border-line bg-sheet p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('leaflet')}
                  className={`flex items-center gap-1 px-2 py-1 text-2xs font-semibold rounded ${
                    viewMode === 'leaflet' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <MapPin className="h-3 w-3" /> Leaflet GIS
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('plate')}
                  className={`flex items-center gap-1 px-2 py-1 text-2xs font-semibold rounded ${
                    viewMode === 'plate' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  <Grid className="h-3 w-3" /> Drafting Sheet
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-3">
                <Compass className="h-3.5 w-3.5 text-indigo" />
                <span>WGS84 EPSG:4326</span>
              </div>
            </div>
          }
        >
          {/* Active Layer Header Bar */}
          <div className="mb-3 flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo" />
              <span className="mono text-2xs font-semibold uppercase text-ink-2">
                Active Layer: {LAYERS.find((l) => l.id === activeLayer)?.en}
              </span>
            </div>
            <span className="mono text-2xs text-ink-3">Click any corner node to inspect GPS</span>
          </div>

          <div className="overflow-hidden border border-line bg-sheet-raised">
            {viewMode === 'leaflet' ? (
              <LeafletMap
                geojson={parcel.geojsonBoundary}
                mouza={parcel.mouza}
                dagNo={parcel.dagNo.split(/[\/ ]/)[0]}
                activeLayer={activeLayer}
                areaDecimal={parcel.areaDecimal}
                landClass={parcel.landClass}
                onStationSelect={(st) =>
                  setSelectedStationInfo({ label: st.label, lat: st.lat, lng: st.lng })
                }
                className="h-[460px] w-full"
              />
            ) : (
              <div className="graticule px-2 py-2">
                <ParcelPlate
                  dagNo={parcel.dagNo.split(/[\/ ]/)[0]}
                  areaDecimal={parcel.areaDecimal}
                  landClass={parcel.landClass}
                  mouza={parcel.mouza}
                  geojson={parcel.geojsonBoundary}
                  onStationSelect={(st: { label: string; lat: number; lng: number }) =>
                    setSelectedStationInfo({ label: st.label, lat: st.lat, lng: st.lng })
                  }
                />
              </div>
            )}
          </div>

          {/* Dynamic GPS Survey Stations Table */}
          <div className="mt-4">
            <p className="mono mb-2 text-2xs uppercase text-ink-3">Survey Station Benchmark Nodes (জরিপ স্টেশন)</p>
            <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
              {stations.map((st) => (
                <div
                  key={st.label}
                  className="group relative bg-sheet px-3 py-2.5 transition-colors hover:bg-ground-sunk"
                >
                  <div className="flex items-center justify-between">
                    <span className="mono block text-2xs uppercase text-ink-3">{st.label}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCoord(st)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      title="Copy coordinates"
                    >
                      {copiedStation === st.label ? (
                        <Check className="h-3 w-3 text-state" />
                      ) : (
                        <Copy className="h-3 w-3 text-ink-3 hover:text-indigo" />
                      )}
                    </button>
                  </div>
                  <span className="mono tnum mt-1 block text-xs font-medium text-ink">
                    {st.lat}, {st.lng}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedStationInfo && (
            <div className="mt-3 border-l-2 border-indigo bg-indigo-soft px-3.5 py-2 text-xs text-indigo">
              <span className="font-semibold">{selectedStationInfo.label} Selected: </span>
              Latitude {selectedStationInfo.lat.toFixed(6)}°N, Longitude {selectedStationInfo.lng.toFixed(6)}°E
            </div>
          )}

          <p className="mt-3 text-xs text-ink-3">
            Authoritative coordinates georeferenced from Bangladesh Digital Survey (BDS). Legal parcel boundary
            remains subject to AC (Land) judicial reconciliation.
          </p>
        </Panel>
      </Reveal>

      <div className="space-y-5">
        {/* Layer Selector */}
        <Reveal delay={80}>
          <Panel label="Survey & GIS Layers" bodyClassName="px-0 py-0">
            <ul>
              {LAYERS.map((l) => (
                <li
                  key={l.id}
                  onClick={() => setActiveLayer(l.id)}
                  className={`cursor-pointer border-b border-line-hair px-5 py-3.5 transition-colors last:border-0 hover:bg-ground-sunk ${
                    activeLayer === l.id ? 'bg-indigo-soft' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <Radio
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          activeLayer === l.id ? 'text-indigo' : 'text-ink-3'
                        }`}
                      />
                      <div>
                        <span className="bn block text-sm font-semibold text-ink">{l.bn}</span>
                        <span className="block text-xs text-ink-3">
                          {l.en} · <span className="mono">{l.meta}</span>
                        </span>
                        <p className="mt-1 text-2xs text-ink-2">{l.description}</p>
                      </div>
                    </div>
                    <StatusMark tone={l.tone}>{l.mark}</StatusMark>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </Reveal>

        {/* Multi-Unit Area & Reconciliation Check */}
        <Reveal delay={120}>
          <Panel label="Cadastral Area Verification">
            <DataRow label="Recorded in খতিয়ান" value={decimals(parcel.areaDecimal)} mono />
            <DataRow label="Standard Katha (কাঠা)" value={katha(parcel.areaDecimal)} mono />
            <DataRow label="Square Feet (বর্গফুট)" value={sqft(parcel.areaDecimal)} mono />
            <DataRow label="Digitized Polygon Area" value={decimals(parcel.mappedAreaDecimal)} mono />
            <DataRow
              label="Spatial Variance (পার্থক্য)"
              value={
                <span className={gap > 0.05 ? 'font-semibold text-amber' : 'text-state'}>
                  {gap === 0 ? 'Exact Match (0.00)' : `${gap.toFixed(2)} decimal variance`}
                </span>
              }
              mono
            />
            <p className="mt-3 text-xs text-ink-3">
              Any variance between deed area and high-resolution drone cadastre under 0.05 decimals is treated as
              acceptable mathematical variance under Survey Act provisions.
            </p>
          </Panel>
        </Reveal>
      </div>
    </div>
  );
}
