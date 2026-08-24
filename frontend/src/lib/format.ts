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
