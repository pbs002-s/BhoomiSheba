import { demoParcels, findDemoParcel } from './demoData';
import type { Complaint, Discrepancy, FaraezInput, FaraezShare, LandUnits, Mutation, MutationStatus, Parcel, Session, TaxRecord } from './types';

export type DataSource = 'live' | 'demo';

let source: DataSource = 'demo';
export const getSource = () => source;

const listeners = new Set<(s: DataSource) => void>();
export function onSourceChange(fn: (s: DataSource) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setSource(next: DataSource) {
  if (next === source) return;
  source = next;
  listeners.forEach((fn) => fn(next));
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(path, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status}`);
    setSource('live');
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------- parcels */

export async function listParcels(query?: string): Promise<Parcel[]> {
  try {
    const url = query ? `/api/parcels?q=${encodeURIComponent(query)}` : '/api/parcels';
    return await req<Parcel[]>(url);
  } catch {
    setSource('demo');
    if (!query) return demoParcels;
    const q = query.toLowerCase().trim();
    return demoParcels.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.khatianNo.toLowerCase().includes(q) ||
        p.dagNo.toLowerCase().includes(q) ||
        p.holdingNo.toLowerCase().includes(q) ||
        p.currentOwner.toLowerCase().includes(q) ||
        p.mouza.toLowerCase().includes(q)
    );
  }
}

export async function getParcel(id: string): Promise<Parcel | null> {
  try {
    return await req<Parcel>(`/api/parcels/${encodeURIComponent(id)}`);
  } catch {
    setSource('demo');
    return findDemoParcel(id) ?? null;
  }
}

/* ------------------------------------------------------------------- tax */

export async function payTax(input: {
  parcelId: string;
  fiscalYear: string;
  amount: number;
  paymentMethod: string;
}): Promise<{ taxRecord: TaxRecord }> {
  const trxId = `${input.paymentMethod.toUpperCase().replace(/\s+/g, '')}_${Math.floor(
    10_000_000 + Math.random() * 90_000_000
  )}`;
  try {
    return await req<{ taxRecord: TaxRecord }>('/api/payments/pay-tax', {
      method: 'POST',
      body: JSON.stringify({ ...input, trxId }),
    });
  } catch {
    setSource('demo');
    const parcel = findDemoParcel(input.parcelId);
    const record = parcel?.taxRecords?.find((t) => t.fiscalYear === input.fiscalYear);
    const dakhilaNumber = `DAK-${new Date().getFullYear()}-${Math.floor(100_000 + Math.random() * 900_000)}`;
    const taxRecord: TaxRecord = {
      ...(record ?? {
        id: 'demo',
        fiscalYear: input.fiscalYear,
        annualDemandBDT: input.amount,
        arrearAmountBDT: 0,
        totalDueBDT: input.amount,
      }),
      paidAmountBDT: input.amount,
      status: 'VERIFIED',
      trxId,
      paymentMethod: input.paymentMethod,
      dakhilaNumber,
      qrCodeUrl: `https://land.gov.bd/verify/dakhila/${dakhilaNumber}`,
      paymentDate: new Date().toISOString(),
    } as TaxRecord;
    if (record) Object.assign(record, taxRecord);
    return { taxRecord };
  }
}

/* -------------------------------------------------------------- mutation */

export async function fileMutation(input: {
  parcelId: string;
  applicantName: string;
  applicantNid: string;
  applicantPhone: string;
  proposedOwner: string;
}): Promise<{ mutation: Mutation }> {
  try {
    return await req<{ mutation: Mutation }>('/api/mutations', {
      method: 'POST',
      body: JSON.stringify({ ...input, dcrAmount: 1150 }),
    });
  } catch {
    setSource('demo');
    const mutation: Mutation = {
      id: `demo-${Date.now()}`,
      caseNumber: `MUT-${new Date().getFullYear()}-DH-${Math.floor(1000 + Math.random() * 9000)}`,
      applicantName: input.applicantName,
      applicantNid: input.applicantNid,
      applicantPhone: input.applicantPhone,
      proposedOwner: input.proposedOwner,
      status: 'SUBMITTED',
      currentStage: 'Stage 1: Application Received & Assigned to ULAO',
      hearingDate: null,
      dcrAmount: 1150,
      remarks: 'Filed online.',
      createdAt: new Date().toISOString(),
    };
    const parcel = findDemoParcel(input.parcelId);
    parcel?.mutations?.unshift(mutation);
    return { mutation };
  }
}

/** Officer action: advance mutation stage or approve */
export async function advanceMutation(
  mutationId: string,
  parcelId: string,
  data?: { action?: 'REJECT'; officerNote?: string; customStatus?: MutationStatus }
): Promise<{ mutation: Mutation }> {
  try {
    return await req<{ mutation: Mutation }>(`/api/mutations/${mutationId}/advance`, {
      method: 'PATCH',
      body: JSON.stringify(data ?? {}),
    });
  } catch {
    setSource('demo');
    const parcel = findDemoParcel(parcelId);
    const m = parcel?.mutations?.find((item) => item.id === mutationId);
    if (m) {
      if (data?.action === 'REJECT') {
        m.status = 'REJECTED';
        m.currentStage = 'Rejected by AC (Land) following judicial review.';
      } else if (m.status === 'SUBMITTED') {
        m.status = 'KANUNGO_VERIFICATION';
        m.currentStage = 'Stage 2: Kanungo Field Survey in Progress';
      } else if (m.status === 'KANUNGO_VERIFICATION') {
        m.status = 'AC_LAND_HEARING';
        m.currentStage = 'Stage 3: Spot Survey Verified. AC Land Hearing Scheduled';
        m.hearingDate = new Date(Date.now() + 7 * 86_400_000).toISOString();
      } else if (m.status === 'AC_LAND_HEARING') {
        m.status = 'DCR_PAYMENT_PENDING';
        m.currentStage = 'Stage 4: Hearing Completed. DCR Fee Due';
      } else if (m.status === 'DCR_PAYMENT_PENDING') {
        m.status = 'APPROVED';
        m.currentStage = 'Completed — new খতিয়ান issued';
        parcel!.currentOwner = m.proposedOwner;
      }
      if (data?.officerNote) {
        m.remarks = `${m.remarks || ''} [Officer: ${data.officerNote}]`.trim();
      }
    }
    return { mutation: m! };
  }
}

/* ---------------------------------------------------------- reconciliation */

export interface AuditCheck {
  name: string;
  status: 'PASS' | 'FLAGGED';
  detail: string;
}

export async function runReconciliation(parcelId: string): Promise<{ checks: AuditCheck[] }> {
  try {
    return await req<{ checks: AuditCheck[] }>('/api/reconciliation/run', {
      method: 'POST',
      body: JSON.stringify({ parcelId }),
    });
  } catch {
    setSource('demo');
    await new Promise((r) => setTimeout(r, 600));
    const parcel = findDemoParcel(parcelId);
    const flagged = (parcel?.discrepancies?.filter((d) => !d.isResolved) ?? []).length > 0;
    return {
      checks: [
        { name: 'Khatian Title Chain', status: 'PASS', detail: 'RS to BS records agree. Title chain intact.' },
        { name: 'Dag & Holding Alignment', status: 'PASS', detail: `Plot Dag matches the upazila holding register.` },
        {
          name: 'Boundary Spatial Envelope',
          status: flagged ? 'FLAGGED' : 'PASS',
          detail: flagged
            ? 'Difference between recorded and mapped area flagged for reconciliation.'
            : 'Vector boundary matches the digitised BDS survey sheet.',
        },
        { name: 'Payment & Arrears Balance', status: 'PASS', detail: 'No unexplained arrears across fiscal years.' },
      ],
    };
  }
}

/** Officer action: resolve discrepancy flag */
export async function resolveFlag(
  flagId: string,
  parcelId: string,
  note?: string
): Promise<{ discrepancy: Discrepancy }> {
  try {
    return await req<{ discrepancy: Discrepancy }>(`/api/reconciliation/flags/${flagId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify({ resolutionNote: note }),
    });
  } catch {
    setSource('demo');
    const parcel = findDemoParcel(parcelId);
    const d = parcel?.discrepancies?.find((item) => item.id === flagId);
    if (d) {
      d.isResolved = true;
      d.flaggedBy = `Resolved by AC (Land)`;
    }
    return { discrepancy: d! };
  }
}

/* ------------------------------------------------------------- complaints */

export async function submitComplaint(input: {
  parcelId: string;
  complainant: string;
  phone: string;
  category: string;
  description: string;
  assignedOffice?: string;
}): Promise<{ complaint: Complaint }> {
  try {
    return await req<{ complaint: Complaint }>('/api/complaints', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    setSource('demo');
    const trackingNo = `CMP-SAV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const complaint: Complaint = {
      id: `cmp-${Date.now()}`,
      trackingNo,
      parcelId: input.parcelId,
      complainant: input.complainant,
      phone: input.phone,
      category: input.category,
      description: input.description,
      assignedOffice: input.assignedOffice || 'Upazila Land Office, Savar',
      status: 'ROUTED',
      createdAt: new Date().toISOString(),
    };
    const parcel = findDemoParcel(input.parcelId);
    if (!parcel?.complaints) parcel!.complaints = [];
    parcel!.complaints.unshift(complaint);
    return { complaint };
  }
}

/* ------------------------------------------------------------- land tools */

export async function convertLandUnits(
  value: number,
  fromUnit: 'decimal' | 'katha' | 'bigha' | 'acre' | 'sqft' | 'sqm'
): Promise<LandUnits> {
  try {
    const res = await req<{ result: LandUnits }>('/api/tools/convert-units', {
      method: 'POST',
      body: JSON.stringify({ value, fromUnit }),
    });
    return res.result;
  } catch {
    setSource('demo');
    let dec = 0;
    switch (fromUnit) {
      case 'decimal':
        dec = value;
        break;
      case 'katha':
        dec = value * 1.65;
        break;
      case 'bigha':
        dec = value * 33.0;
        break;
      case 'acre':
        dec = value * 100.0;
        break;
      case 'sqft':
        dec = value / 435.6;
        break;
      case 'sqm':
        dec = value / 40.4686;
        break;
    }
    return {
      decimal: Number(dec.toFixed(4)),
      katha: Number((dec / 1.65).toFixed(4)),
      bigha: Number((dec / 33.0).toFixed(4)),
      acre: Number((dec / 100.0).toFixed(4)),
      squareFeet: Number((dec * 435.6).toFixed(2)),
      squareMetres: Number((dec * 40.4686).toFixed(2)),
    };
  }
}

export async function calculateFaraez(input: FaraezInput): Promise<{ shares: FaraezShare[]; totalDistributed: number }> {
  try {
    return await req<{ shares: FaraezShare[]; totalDistributed: number }>('/api/tools/faraez', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    setSource('demo');
    const { totalDecimal, sons, daughters, wife, husband, father, mother } = input;
    const hasChildren = sons > 0 || daughters > 0;
    const shares: FaraezShare[] = [];
    let remaining = totalDecimal;

    if (wife > 0 && husband === 0) {
      const shareVal = hasChildren ? totalDecimal * (1 / 8) : totalDecimal * (1 / 4);
      shares.push({
        relation: 'Wife',
        relationBn: 'স্ত্রী',
        count: wife,
        fraction: hasChildren ? '1/8' : '1/4',
        totalDecimal: Number(shareVal.toFixed(4)),
        perPersonDecimal: Number((shareVal / wife).toFixed(4)),
        percentage: Number(((shareVal / totalDecimal) * 100).toFixed(2)),
      });
      remaining -= shareVal;
    } else if (husband > 0 && wife === 0) {
      const shareVal = hasChildren ? totalDecimal * (1 / 4) : totalDecimal * (1 / 2);
      shares.push({
        relation: 'Husband',
        relationBn: 'স্বামী',
        count: 1,
        fraction: hasChildren ? '1/4' : '1/2',
        totalDecimal: Number(shareVal.toFixed(4)),
        perPersonDecimal: Number(shareVal.toFixed(4)),
        percentage: Number(((shareVal / totalDecimal) * 100).toFixed(2)),
      });
      remaining -= shareVal;
    }

    if (father > 0 && hasChildren) {
      const shareVal = totalDecimal * (1 / 6);
      shares.push({
        relation: 'Father',
        relationBn: 'পিতা',
        count: 1,
        fraction: '1/6',
        totalDecimal: Number(shareVal.toFixed(4)),
        perPersonDecimal: Number(shareVal.toFixed(4)),
        percentage: Number(((shareVal / totalDecimal) * 100).toFixed(2)),
      });
      remaining -= shareVal;
    }

    if (mother > 0) {
      const shareVal = hasChildren ? totalDecimal * (1 / 6) : totalDecimal * (1 / 3);
      shares.push({
        relation: 'Mother',
        relationBn: 'মাতা',
        count: 1,
        fraction: hasChildren ? '1/6' : '1/3',
        totalDecimal: Number(shareVal.toFixed(4)),
        perPersonDecimal: Number(shareVal.toFixed(4)),
        percentage: Number(((shareVal / totalDecimal) * 100).toFixed(2)),
      });
      remaining -= shareVal;
    }

    if (hasChildren && remaining > 0) {
      const totalUnits = sons * 2 + daughters * 1;
      const unitValue = remaining / totalUnits;
      if (sons > 0) {
        shares.push({
          relation: 'Sons',
          relationBn: 'পুত্র',
          count: sons,
          fraction: `${sons * 2}/${totalUnits} of residue`,
          totalDecimal: Number((unitValue * 2 * sons).toFixed(4)),
          perPersonDecimal: Number((unitValue * 2).toFixed(4)),
          percentage: Number((((unitValue * 2 * sons) / totalDecimal) * 100).toFixed(2)),
        });
      }
      if (daughters > 0) {
        shares.push({
          relation: 'Daughters',
          relationBn: 'কন্যা',
          count: daughters,
          fraction: `${daughters}/${totalUnits} of residue`,
          totalDecimal: Number((unitValue * daughters).toFixed(4)),
          perPersonDecimal: Number(unitValue.toFixed(4)),
          percentage: Number((((unitValue * daughters) / totalDecimal) * 100).toFixed(2)),
        });
      }
    }

    const totalDistributed = shares.reduce((acc, s) => acc + s.totalDecimal, 0);
    return { shares, totalDistributed: Number(totalDistributed.toFixed(4)) };
  }
}

/* ---------------------------------------------------------------- session */

const SESSION_KEY = 'bhumi.session';

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage blocked */
  }
}
