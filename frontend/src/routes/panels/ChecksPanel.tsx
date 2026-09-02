import { useState } from 'react';
import { Loader2, RefreshCw, CheckCircle2, Scale, X } from 'lucide-react';
import type { Parcel, Discrepancy } from '../../lib/types';
import { runReconciliation, resolveFlag, readSession, type AuditCheck } from '../../lib/api';
import { Button, Panel, StatusMark, inputClass } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { shortDate } from '../../lib/format';

const SEVERITY_TONE = { HIGH: 'seal', MEDIUM: 'amber', LOW: 'indigo' } as const;

export default function ChecksPanel({ parcel, onChanged }: { parcel: Parcel; onChanged?: () => void }) {
  const session = readSession();
  const isOfficer = session?.role === 'officer';

  const [checks, setChecks] = useState<AuditCheck[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [resolvingFlag, setResolvingFlag] = useState<Discrepancy | null>(null);
  const [resolvingNote, setResolvingNote] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);
  const [ranAt, setRanAt] = useState<string | null>(null);
  const flags = parcel.discrepancies?.filter((d) => !d.isResolved) ?? [];

  const run = async () => {
    setBusy(true);
    const res = await runReconciliation(parcel.id);
    setChecks(res.checks);
    setRanAt(new Date().toISOString());
    setBusy(false);
  };

  const handleOpenResolve = (flag: Discrepancy) => {
    setResolvingFlag(flag);
    setResolvingNote('সরেজমিন পরিমাপ ও ড্রোন জরিপ অনুযায়ী রাজস্ব আদালতে গরমিল নিষ্পত্তি করা হলো।');
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingFlag) return;
    setSubmittingResolution(true);
    await resolveFlag(resolvingFlag.id, parcel.id, resolvingNote);
    setSubmittingResolution(false);
    setResolvingFlag(null);
    if (onChanged) onChanged();
  };


  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <Reveal>
          <Panel
            label="Multi-Source Reconciliation Audit"
            meta={ranAt ? `run ${new Date(ranAt).toLocaleTimeString('en-GB')}` : 'not run yet'}
            action={
              <Button size="sm" onClick={run} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                {busy ? 'Auditing' : 'Run Audit'}
              </Button>
            }
          >
            <p className="text-sm text-ink-2">
              Automated 4-way consistency audit checking e-Parcha digital khatiyan, Upazila holding register,
              DLRS vector GIS cadastre, and national tax ledger.
            </p>

            {!checks && !busy && (
              <p className="mt-4 border border-line bg-ground-sunk px-4 py-6 text-center text-sm text-ink-3">
                Click "Run Audit" to verify multi-source cross-layer consistency.
              </p>
            )}

            {checks && (
              <ul className="mt-4">
                {checks.map((c, i) => (
                  <li
                    key={c.name}
                    className="anim-sheet-in flex items-start justify-between gap-4 border-b border-line-hair py-3 last:border-0"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <span>
                      <span className="block text-sm font-medium text-ink">{c.name}</span>
                      <span className="mt-0.5 block text-sm text-ink-2">{c.detail}</span>
                    </span>
                    <StatusMark tone={c.status === 'PASS' ? 'state' : 'amber'}>
                      {c.status === 'PASS' ? 'Agrees (মিল আছে)' : 'Differs (পার্থক্য)'}
                    </StatusMark>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </Reveal>

        <Reveal delay={80}>
          <div className="border-l-2 border-line-strong bg-sheet px-4 py-3.5">
            <p className="text-xs text-ink-3">
              A difference between two records is a reason to check, not a legal finding. Historical survey
              cadastres were conducted across different decades (CS 1940, RS 1988, BS 2015, BDS 2026).
            </p>
          </div>
        </Reveal>
      </div>

      <Reveal delay={40}>
        <Panel label="Open Discrepancy Flags" bodyClassName="px-0 py-0" meta={`${flags.length}`}>
          {flags.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-state" />
              <p className="mt-2 text-sm font-medium text-ink">No Discrepancies Flagged</p>
              <p className="text-xs text-ink-3">All spatial and titular records align cleanly.</p>
            </div>
          ) : (
            <ul>
              {flags.map((d) => (
                <li key={d.id} className="border-b border-line-hair px-5 py-4 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{d.mismatchType}</p>
                    <StatusMark tone={SEVERITY_TONE[d.severity as keyof typeof SEVERITY_TONE] ?? 'neutral'}>
                      {d.severity}
                    </StatusMark>
                  </div>
                  <dl className="mt-3 space-y-1.5">
                    <div className="flex gap-3 text-xs">
                      <dt className="mono w-16 shrink-0 uppercase text-ink-3">Source A</dt>
                      <dd className="text-ink-2">{d.sourceA}</dd>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <dt className="mono w-16 shrink-0 uppercase text-ink-3">Source B</dt>
                      <dd className="text-ink-2">{d.sourceB}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="mono text-2xs uppercase text-ink-3">
                      {d.flaggedBy} · {shortDate(d.createdAt)}
                    </p>
                    {isOfficer && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenResolve(d)}
                      >
                        <Scale className="h-3 w-3" /> Resolve Flag
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </Reveal>

      {/* Discrepancy Resolution Modal */}
      {resolvingFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md border border-line bg-sheet p-6 shadow-xl animate-sheet-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-indigo">
                <Scale className="h-5 w-5" />
                <h3 className="sheet-title text-base font-semibold text-ink">
                  বিরোধ ও গরমিল নিষ্পত্তি আদেশ
                </h3>
              </div>
              <button onClick={() => setResolvingFlag(null)} className="text-ink-3 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolve} className="mt-4 space-y-4 text-xs">
              <div className="bg-ground-sunk p-3 rounded border border-line">
                <p className="font-semibold text-ink">{resolvingFlag.mismatchType}</p>
                <p className="text-2xs text-ink-3 mt-1">
                  Source A: {resolvingFlag.sourceA} &middot; Source B: {resolvingFlag.sourceB}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  সহকারী কমিশনার (ভূমি) এর নিষ্পত্তিমূলক আদেশ (Resolution Finding):
                </label>
                <textarea
                  rows={3}
                  value={resolvingNote}
                  onChange={(e) => setResolvingNote(e.target.value)}
                  className={`${inputClass} w-full font-sans`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button size="sm" type="button" onClick={() => setResolvingFlag(null)}>
                  বাতিল (Cancel)
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={submittingResolution}>
                  {submittingResolution ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  নিষ্পত্তি কার্যকর করুন
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
