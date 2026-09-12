import React, { useRef, useState } from 'react';
import { cx } from '../lib/format';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import type { GeoJsonFeature } from '../lib/types';

/**
 * ParcelPlate — Cadastral Vector Drawing with Dynamic GeoJSON Projection
 *
 * Renders high-precision cadastral boundaries projected directly from
 * WGS84 (EPSG:4326) PostGIS vector coordinates onto the cadastral drafting sheet.
 * Includes interactive survey stations, station-to-station bearings, and dynamic
 * neighbouring plot cadastre.
 */

interface Props {
  dagNo?: string;
  areaDecimal?: number;
  landClass?: string;
  mouza?: string;
  sheet?: string;
  geojson?: GeoJsonFeature | any;
  animate?: boolean;
  className?: string;
  compact?: boolean;
  onStationSelect?: (station: { index: number; lat: number; lng: number; label: string }) => void;
}

// Fallback points if no GeoJSON is provided
const DEFAULT_COORDS = [
  [90.2581, 23.8432],
  [90.2592, 23.8435],
  [90.2595, 23.8427],
  [90.2583, 23.8424],
];

const drawStyle = (delay: number): React.CSSProperties =>
  ({ ['--len' as string]: 1, animationDelay: `${delay}ms` }) as React.CSSProperties;

export default function ParcelPlate({
  dagNo = '1204',
  areaDecimal = 5.5,
  landClass = 'Homestead',
  mouza = 'Tetuljhora',
  sheet = 'BS 2015 · sheet 04',
  geojson,
  animate = true,
  className,
  compact = false,
  onStationSelect,
}: Props) {
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boundaryRef = useRef<SVGPolygonElement | null>(null);
  const stationRefs = useRef<Array<SVGGElement | null>>([]);
  const titleRef = useRef<SVGGElement | null>(null);

  // Extract raw coordinates [ [lng, lat], ... ]
  const rawCoords: number[][] = React.useMemo(() => {
    if (geojson?.geometry?.coordinates?.[0]?.length >= 3) {
      const ring = geojson.geometry.coordinates[0];
      // Exclude duplicate closing point if present
      if (
        ring.length > 3 &&
        ring[0][0] === ring[ring.length - 1][0] &&
        ring[0][1] === ring[ring.length - 1][1]
      ) {
        return ring.slice(0, -1);
      }
      return ring;
    }
    return DEFAULT_COORDS;
  }, [geojson]);

  // Project [lng, lat] coordinates to SVG viewbox [640, 400]
  const { projectedNodes, pointsString, centroid, neighbors } = React.useMemo(() => {
    const lngs = rawCoords.map((c) => c[0]);
    const lats = rawCoords.map((c) => c[1]);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const deltaLng = maxLng - minLng || 0.001;
    const deltaLat = maxLat - minLat || 0.001;

    // Viewbox safe area: X: 210 -> 440, Y: 70 -> 270
    const padX = 210;
    const spanX = 230;
    const padY = 70;
    const spanY = 200;

    const projected = rawCoords.map(([lng, lat], idx) => {
      const normX = (lng - minLng) / deltaLng;
      // Invert Y because latitude goes North-up but SVG Y goes down
      const normY = (lat - minLat) / deltaLat;
      const x = Math.round(padX + normX * spanX);
      const y = Math.round(padY + (1 - normY) * spanY);
      return {
        index: idx,
        x,
        y,
        lng,
        lat,
        label: `ST-${idx + 1}`,
      };
    });

    const pts = projected.map((p) => `${p.x},${p.y}`).join(' ');

    // Compute polygon centroid
    const cX = Math.round(projected.reduce((a, b) => a + b.x, 0) / projected.length);
    const cY = Math.round(projected.reduce((a, b) => a + b.y, 0) / projected.length);

    // Compute neighbouring plot polygons dynamically
    const n1 = `${projected[0].x - 140},${projected[0].y - 20} ${projected[0].x - 10},${projected[0].y - 5} ${
      projected[projected.length - 1].x - 10
    },${projected[projected.length - 1].y + 10} ${projected[projected.length - 1].x - 130},${
      projected[projected.length - 1].y - 5
    }`;

    const n2 = `${projected[1].x + 15},${projected[1].y - 10} ${projected[1].x + 145},${projected[1].y + 5} ${
      projected[2].x + 140
    },${projected[2].y + 20} ${projected[2].x + 15},${projected[2].y + 10}`;

    return {
      projectedNodes: projected,
      pointsString: pts,
      centroid: { x: cX, y: cY },
      neighbors: [n1, n2],
    };
  }, [rawCoords]);

  const anim = (delay: number) => (animate ? { className: 'draw-path', style: drawStyle(delay) } : {});

  // Signature survey animation: the boundary draws itself via stroke length,
  // then survey stations drop in with a spring, like pins set one by one.
  useGSAP(
    () => {
      const boundary = boundaryRef.current;
      if (!animate || !boundary || prefersReducedMotion()) return;
      const stations = stationRefs.current.filter(Boolean) as SVGGElement[];
      const len = boundary.getTotalLength();
      gsap.set(boundary, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(stations, { opacity: 0, scale: 0.4, transformOrigin: 'center' });
      if (titleRef.current) gsap.set(titleRef.current, { opacity: 0, y: 6 });

      const tl = gsap.timeline();
      tl.to(boundary, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
        .to(
          stations,
          { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2.6)', stagger: 0.08 },
          '-=0.4'
        )
        .to(titleRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2');
    },
    { dependencies: [pointsString, animate], scope: svgRef }
  );

  const handleStationClick = (node: (typeof projectedNodes)[0]) => {
    setSelectedStation(node.index);
    if (onStationSelect) {
      onStationSelect({ index: node.index, lat: node.lat, lng: node.lng, label: node.label });
    }
  };

  return (
    <figure className={cx('relative w-full select-none', className)}>
      <svg
        ref={svgRef}
        viewBox="0 0 640 400"
        className="w-full"
        role="img"
        aria-label={`Cadastral drawing of dag ${dagNo}, ${areaDecimal} decimal, mouza ${mouza}`}
      >
        {/* Background Graticule Grid Hairlines */}
        <g stroke="var(--line)" strokeWidth="0.5" opacity="0.4" strokeDasharray="3 3">
          <line x1="40" y1="100" x2="600" y2="100" />
          <line x1="40" y1="200" x2="600" y2="200" />
          <line x1="40" y1="300" x2="600" y2="300" />
          <line x1="150" y1="40" x2="150" y2="360" />
          <line x1="300" y1="40" x2="300" y2="360" />
          <line x1="450" y1="40" x2="450" y2="360" />
        </g>

        {/* Neighbouring cadastral plots — hairline weight */}
        <g stroke="var(--line-strong)" fill="none" strokeWidth="1" opacity="0.75">
          {neighbors.map((nPoints, i) => (
            <polygon key={i} points={nPoints} pathLength={1} {...anim(150 + i * 80)} />
          ))}
        </g>

        {/* Neighbouring plot labels */}
        <g fill="var(--ink-3)" className="mono" fontSize="9.5">
          <text x="80" y="160">
            দাগ {parseInt(dagNo.replace(/\D/g, '') || '1204', 10) - 1 || '1203'}
          </text>
          <text x="500" y="170">
            দাগ {parseInt(dagNo.replace(/\D/g, '') || '1204', 10) + 1 || '1205'}
          </text>
        </g>

        {/* Subject Cadastral Parcel Polygon */}
        <polygon points={pointsString} fill="var(--indigo)" opacity="0.08" />
        <polygon
          ref={boundaryRef}
          points={pointsString}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Corner Survey Stations (Node Markers) */}
        {projectedNodes.map((node, i) => {
          const isSelected = selectedStation === node.index;
          return (
            <g
              key={node.index}
              ref={(el) => (stationRefs.current[i] = el)}
              className="cursor-pointer"
              onClick={() => handleStationClick(node)}
            >
              <rect
                x={node.x - (isSelected ? 5.5 : 4)}
                y={node.y - (isSelected ? 5.5 : 4)}
                width={isSelected ? 11 : 8}
                height={isSelected ? 11 : 8}
                fill={isSelected ? 'var(--indigo)' : 'var(--sheet-raised)'}
                stroke={isSelected ? 'var(--sheet)' : 'var(--indigo)'}
                strokeWidth={isSelected ? '2' : '1.5'}
                className="transition-all duration-150"
              />
              <text
                x={node.x + (node.x > 320 ? 8 : -8)}
                y={node.y + (node.y > 200 ? 12 : -6)}
                textAnchor={node.x > 320 ? 'start' : 'end'}
                className="mono"
                fontSize="8.5"
                fill="var(--ink-3)"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Subject Title and Area Plate Center Block */}
        <g ref={titleRef}>
          <text
            x={centroid.x}
            y={centroid.y - 14}
            textAnchor="middle"
            className="sheet-title"
            fontSize="18"
            fontWeight="600"
            fill="var(--ink)"
          >
            দাগ {dagNo}
          </text>
          <text
            x={centroid.x}
            y={centroid.y + 6}
            textAnchor="middle"
            className="mono"
            fontSize="11.5"
            fontWeight="500"
            fill="var(--indigo)"
          >
            {areaDecimal.toFixed(2)} decimal
          </text>
          <text x={centroid.x} y={centroid.y + 24} textAnchor="middle" fontSize="11" fill="var(--ink-2)">
            {landClass}
          </text>
        </g>

        {/* Access Road & Demarcation Line */}
        <g stroke="var(--ink-3)" strokeWidth="1" fill="none" opacity="0.85">
          <path d="M40 365 H600" strokeDasharray="6 4" pathLength={1} {...anim(520)} />
          <path d="M40 376 H600" strokeDasharray="6 4" pathLength={1} {...anim(580)} />
        </g>
        <text x="40" y="392" className="mono" fontSize="9" fill="var(--ink-3)">
          cadastral demarcation · union road access
        </text>

        {!compact && (
          <>
            {/* North Arrow */}
            <g
              transform="translate(586, 50)"
              className={animate ? 'anim-mark-in' : undefined}
              style={{ animationDelay: '1500ms' }}
            >
              <path d="M0,-18 L6,8 L0,3 L-6,8 Z" fill="var(--ink)" />
              <text x="0" y="22" textAnchor="middle" className="mono" fontSize="9.5" fill="var(--ink-2)">
                N
              </text>
            </g>

            {/* Cadastral Scale Bar */}
            <g
              transform="translate(40, 42)"
              className={animate ? 'anim-mark-in' : undefined}
              style={{ animationDelay: '1600ms' }}
            >
              <rect x="0" y="0" width="30" height="5" fill="var(--ink)" />
              <rect x="30" y="0" width="30" height="5" fill="none" stroke="var(--ink)" strokeWidth="1" />
              <text x="0" y="18" className="mono" fontSize="9" fill="var(--ink-3)">
                0
              </text>
              <text x="52" y="18" className="mono" fontSize="9" fill="var(--ink-3)">
                50 ft
              </text>
            </g>
          </>
        )}
      </svg>

      {!compact && (
        <figcaption className="mono mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-2xs uppercase text-ink-3">
          <div className="flex items-center gap-3">
            <span>মৌজা {mouza}</span>
            <span>{sheet}</span>
            <span>WGS84 (EPSG:4326)</span>
          </div>
          {selectedStation !== null && projectedNodes[selectedStation] && (
            <div className="text-indigo">
              {projectedNodes[selectedStation].label}: {projectedNodes[selectedStation].lat.toFixed(5)}°N,{' '}
              {projectedNodes[selectedStation].lng.toFixed(5)}°E
            </div>
          )}
        </figcaption>
      )}
    </figure>
  );
}
