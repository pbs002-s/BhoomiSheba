import React, { useState } from 'react';
import { Loader2, Printer, ShieldCheck } from 'lucide-react';
import type { Parcel, TaxRecord } from '../../lib/types';
import { payTax } from '../../lib/api';
import { Button, DataRow, Eyebrow, Field, Panel, StatusMark, inputClass } from '../../components/ui';
import { Reveal } from '../../components/motion';
import Modal from '../../components/Modal';
import ParcelPlate from '../../components/ParcelPlate';
import { shortDate, taka } from '../../lib/format';

const METHODS = ['bKash', 'Nagad', 'Rocket', 'Card'];

const STATUS_TONE = {
  PENDING: 'seal',
  FAILED: 'seal',
  VERIFIED: 'state',
  RECONCILED: 'state',
  REFUNDED: 'amber',
} as const;

const STATUS_TEXT = {
  PENDING: 'Due',
  FAILED: 'Failed',
  VERIFIED: 'Paid',
  RECONCILED: 'Paid & reconciled',
  REFUNDED: 'Refunded',
} as const;

export default function TaxPanel({ parcel, onChanged }: { parcel: Parcel; onChanged: () => void }) {
  const records = parcel.taxRecords ?? [];
  const due = records.find((r) => r.status === 'PENDING') ?? null;

  const [payOpen, setPayOpen] = useState(false);
  const [target, setTarget] = useState<TaxRecord | null>(null);
  const [method, setMethod] = useState('bKash');
  const [phone, setPhone] = useState(parcel.phone.replace(/\D/g, '').slice(-11));
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<TaxRecord | null>(null);

  const startPayment = (record: TaxRecord) => {
    setTarget(record);
    setPayOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setBusy(true);
    const { taxRecord } = await payTax({
      parcelId: parcel.id,
      fiscalYear: target.fiscalYear,
      amount: target.totalDueBDT,
      paymentMethod: method,
    });
    setBusy(false);
    setPayOpen(false);
    setReceipt(taxRecord);
    onChanged();
  };

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <Panel label="Tax account" bodyClassName="px-0 py-0" meta={`${records.length} fiscal years`}>
            {records.length === 0 ? (
              <p className="px-5 py-5 text-sm text-ink-3">No tax record has been raised for this parcel.</p>
            ) : (
              <ul>
                {records.map((r) => (
                  <li key={r.id} className="border-b border-line-hair px-5 py-4 last:border-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="mono text-sm text-ink">{r.fiscalYear}</p>
                        <p className="mt-1 text-xs text-ink-3">
                          Demand {taka(r.annualDemandBDT)}
                          {r.arrearAmountBDT > 0 && <> · arrears {taka(r.arrearAmountBDT)}</>}
                        </p>
                      </div>
                      <StatusMark tone={STATUS_TONE[r.status]}>{STATUS_TEXT[r.status]}</StatusMark>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <p className="mono tnum text-xl font-semibold text-ink">
                        {r.status === 'PENDING' ? taka(r.totalDueBDT) : taka(r.paidAmountBDT)}
                      </p>
                      {r.status === 'PENDING' ? (
                        <Button variant="primary" size="sm" onClick={() => startPayment(r)}>
                          Pay this bill
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="mono text-2xs text-ink-3">{r.dakhilaNumber}</span>
                          <Button size="sm" onClick={() => setReceipt(r)}>
                            View দাখিলা
                          </Button>
                        </div>
                      )}
                    </div>

                    {r.trxId && (
                      <p className="mono mt-2 text-2xs uppercase text-ink-3">
                        {r.paymentMethod} · {r.trxId} · {shortDate(r.paymentDate)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </Reveal>

        <div className="space-y-5">
          <Reveal delay={80}>
            <Panel label={due ? 'Due now' : 'Nothing due'}>
              {due ? (
                <>
                  <p className="mono tnum text-3xl font-semibold text-ink">{taka(due.totalDueBDT)}</p>
                  <p className="bn mt-1 text-sm text-ink-2">
                    {due.fiscalYear} অর্থবছরের ভূমি উন্নয়ন কর
                  </p>
                  <Button variant="primary" className="mt-5 w-full" onClick={() => startPayment(due)}>
                    Pay {taka(due.totalDueBDT)}
                  </Button>
                  <p className="mt-3 text-xs text-ink-3">
                    You get a transaction reference before the payment completes. If the connection drops, the
                    reference is enough to check the state — do not pay a second time.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink">Every raised bill for this parcel is settled.</p>
                  <p className="mt-2 text-xs text-ink-3">
                    The next demand is raised at the start of the fiscal year, in Baishakh.
                  </p>
                </>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={120}>
            <Panel label="How a payment settles">
              <ol>
                {[
                  ['01', 'Reference issued', 'A permanent ID, before money moves.'],
                  ['02', 'Gateway confirms', 'bKash, Nagad, Rocket or card returns a result.'],
                  ['03', 'Record reconciled', 'The tax account is matched against the gateway.'],
                  ['04', 'দাখিলা issued', 'Receipt stored with the parcel, printable and verifiable.'],
                ].map(([n, t, d]) => (
                  <li key={n} className="flex gap-4 border-b border-line-hair py-3 last:border-0">
                    <span className="mono text-xs text-indigo">{n}</span>
                    <span>
                      <span className="block text-sm text-ink">{t}</span>
                      <span className="block text-xs text-ink-3">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* ---------------------------------------------------------- pay */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        label={target?.fiscalYear}
        title="Pay land development tax"
        bn="ভূমি উন্নয়ন কর পরিশোধ"
      >
        {target && (
          <form onSubmit={submit} className="space-y-5">
            <div className="border border-line bg-ground-sunk px-4 py-3">
              <DataRow label="Annual demand" value={taka(target.annualDemandBDT)} mono />
              <DataRow label="Arrears" value={taka(target.arrearAmountBDT)} mono />
              <div className="flex items-baseline justify-between pt-2.5">
                <span className="text-sm font-medium text-ink">Total</span>
                <span className="mono tnum text-lg font-semibold text-ink">{taka(target.totalDueBDT)}</span>
              </div>
            </div>

            <div>
              <span className="mono mb-2 block text-2xs uppercase text-ink-3">Pay with</span>
              <div className="grid grid-cols-4 gap-px border border-line bg-line">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`px-2 py-2.5 text-xs transition-colors duration-1 ${
                      method === m ? 'bg-indigo-soft text-indigo' : 'bg-sheet-raised text-ink-2 hover:bg-ground-sunk'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Mobile wallet number" htmlFor="wallet">
              <input
                id="wallet"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className={`${inputClass} mono tnum`}
              />
            </Field>

            <p className="text-xs text-ink-3">
              Demonstration only. No payment instruction leaves this browser.
            </p>

            <div className="flex gap-2">
              <Button type="button" onClick={() => setPayOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" type="submit" className="flex-1" disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Paying' : `Pay ${taka(target.totalDueBDT)}`}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ------------------------------------------------------ receipt */}
      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        label="Receipt"
        title="দাখিলা"
        bn="Land development tax receipt"
        wide
      >
        {receipt && (
          <div>
            <div id="printable-dakhila" className="border border-line bg-sheet-raised p-6">
              <div className="flex items-start justify-between gap-6 border-b border-line pb-4">
                <div>
                  <Eyebrow>Government of Bangladesh · Ministry of Land</Eyebrow>
                  <p className="bn mt-1 text-xl font-semibold text-ink">ভূমি উন্নয়ন কর রসিদ</p>
                  <p className="text-sm text-ink-2">Land development tax receipt</p>
                </div>
                <div className="text-right">
                  <p className="mono text-2xs uppercase text-ink-3">দাখিলা no.</p>
                  <p className="mono text-sm font-semibold text-ink">{receipt.dakhilaNumber}</p>
                </div>
              </div>

              <div className="grid gap-6 py-4 sm:grid-cols-2">
                <div>
                  <DataRow label="Parcel" value={parcel.id} mono />
                  <DataRow label="Owner" value={parcel.currentOwner} />
                  <DataRow label="Mouza / দাগ" value={`${parcel.mouza} / ${parcel.dagNo}`} />
                  <DataRow label="Fiscal year" value={receipt.fiscalYear} mono />
                </div>
                <div>
                  <DataRow label="Amount paid" value={taka(receipt.paidAmountBDT)} mono />
                  <DataRow label="Method" value={receipt.paymentMethod ?? '—'} />
                  <DataRow label="Transaction" value={receipt.trxId ?? '—'} mono />
                  <DataRow label="Date" value={shortDate(receipt.paymentDate)} mono />
                </div>
              </div>

              <div className="flex items-end justify-between gap-6 border-t border-line pt-4">
                <div className="w-40 shrink-0 opacity-70">
                  <ParcelPlate
                    compact
                    animate={false}
                    dagNo={parcel.dagNo.split(/[\/ ]/)[0]}
                    areaDecimal={parcel.areaDecimal}
                    landClass={parcel.landClass}
                    geojson={parcel.geojsonBoundary}
                  />
                </div>
                <div className="text-right">
                  <StatusMark tone="state">
                    <ShieldCheck className="h-3 w-3" /> Reconciled
                  </StatusMark>
                  <p className="mono mt-2 max-w-[220px] break-all text-2xs text-ink-3">{receipt.qrCodeUrl}</p>
                </div>
              </div>
            </div>

            <div className="no-print mt-5 flex gap-2">
              <Button className="flex-1" onClick={() => setReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
