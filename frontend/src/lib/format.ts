/** Amounts are money. They get a currency mark, grouping, and no decimals. */
export function taka(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return `৳${n.toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;
}

export function decimals(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `${n.toFixed(2)} decimal`;
}

export function katha(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const k = n / 1.65;
  return `${k.toFixed(2)} কাঠা (${k.toFixed(2)} katha)`;
}

export function bigha(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const b = n / 33.0;
  return `${b.toFixed(2)} বিঘা (${b.toFixed(2)} bigha)`;
}

export function sqft(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  const s = n * 435.6;
  return `${s.toLocaleString('en-US', { maximumFractionDigits: 1 })} sq ft`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return '';
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return '';
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) {
    const m = Math.round(days / 30);
    return m === 1 ? 'last month' : `${m} months ago`;
  }
  const y = Math.round(days / 365);
  return y === 1 ? 'last year' : `${y} years ago`;
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** Bangla numerals, for the places where the Bangla line is the primary one. */
export function bnNum(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/** Mask an NID down to its last four digits. It is shoulder-surfed constantly. */
export function maskNid(nid: string): string {
  const clean = nid.replace(/\s/g, '');
  if (clean.length < 5) return nid;
  return `•••• •••• ${clean.slice(-4)}`;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Converts WGS84 (Lat, Lng) to Bangladesh Transverse Mercator (BTM) coordinates */
export function toBTM(lat: number, lng: number): { easting: number; northing: number; formatted: string } {
  const rad = Math.PI / 180;
  const a = 6378137.0; // WGS84 semi-major axis
  const f = 1 / 298.257223563;
  const e2 = 2 * f - f * f;
  const k0 = 0.9996;
  const lon0 = 90.0 * rad; // Central Meridian 90° E
  const falseEasting = 500000.0;
  const falseNorthing = 0.0;

  const phi = lat * rad;
  const lambda = lng * rad;

  const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
  const T = Math.tan(phi) * Math.tan(phi);
  const C = (e2 / (1 - e2)) * Math.cos(phi) * Math.cos(phi);
  const A = (lambda - lon0) * Math.cos(phi);

  // Meridional distance M
  const M = a * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi
    - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi)
    + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi)
    - (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi));

  const easting = falseEasting + k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * (e2 / (1 - e2))) * Math.pow(A, 5) / 120);
  const northing = falseNorthing + k0 * (M + N * Math.tan(phi) * (Math.pow(A, 2) / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * (e2 / (1 - e2))) * Math.pow(A, 6) / 720));

  return {
    easting: Math.round(easting),
    northing: Math.round(northing),
    formatted: `E ${Math.round(easting).toLocaleString()} m, N ${Math.round(northing).toLocaleString()} m`,
  };
}

/** Traditional Bengali surveyor units */
export function toLinks(meters: number): number {
  return Number((meters / 0.201168).toFixed(1)); // 1 link = 7.92 in = 0.201168 m
}

export function toGaj(meters: number): number {
  return Number((meters / 0.9144).toFixed(1)); // 1 gaj = 1 yard = 3 ft = 0.9144 m
}

export function toFeet(meters: number): number {
  return Number((meters * 3.28084).toFixed(1));
}

