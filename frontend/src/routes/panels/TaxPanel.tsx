import React, { useState } from 'react';
import { Loader2, Printer, ShieldCheck, CheckCircle2, QrCode } from 'lucide-react';
import type { Parcel, TaxRecord } from '../../lib/types';
import { Button, DataRow, Eyebrow, Panel, StatusMark } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { useLanguage } from '../../lib/language';
import Modal from '../../components/Modal';
import ParcelPlate from '../../components/ParcelPlate';
import PaymentGatewayModal from '../../components/PaymentGatewayModal';
import { shortDate, taka } from '../../lib/format';

const STATUS_TONE = {
  PENDING: 'seal',
  FAILED: 'seal',
  VERIFIED: 'state',
  RECONCILED: 'state',
  REFUNDED: 'amber',
} as const;

export default function TaxPanel({ parcel, onChanged }: { parcel: Parcel; onChanged: () => void }) {
  const { lang, t, pickLang } = useLanguage();
  const records = parcel.taxRecords ?? [];
  const due = records.find((r) => r.status === 'PENDING') ?? null;

  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<TaxRecord | null>(null);
  const [receipt, setReceipt] = useState<TaxRecord | null>(null);

  const getStatusText = (status: keyof typeof STATUS_TONE) => {
    switch (status) {
      case 'PENDING':
        return t('Due', 'বকেয়া');
      case 'FAILED':
        return t('Failed', 'ব্যর্থ');
      case 'VERIFIED':
        return t('Paid', 'পরিশোধিত');
      case 'RECONCILED':
        return t('Paid & Reconciled', 'পরিশোধিত ও সমন্বিত');
      case 'REFUNDED':
        return t('Refunded', 'ফেরতকৃত');
      default:
        return status;
    }
  };

  const startPayment = (record: TaxRecord) => {
    setSelectedForPayment(record);
    setGatewayOpen(true);
  };

  const handlePaymentSuccess = (paidRecord: TaxRecord) => {
    setGatewayOpen(false);
    setReceipt(paidRecord);
    onChanged();
  };

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Reveal>
          <Panel
            label={t('Tax Account', 'কর হিসাব বিবরণী')}
            bodyClassName="px-0 py-0"
            meta={`${records.length} ${t('fiscal years', 'টি অর্থবছর')}`}
          >
            {records.length === 0 ? (
              <p className="px-5 py-5 text-sm text-ink-3">
                {t('No tax record has been raised for this parcel.', 'এই খতিয়ানের কোনো কর দাবি পাওয়া যায়নি।')}
              </p>
            ) : (
              <ul>
                {records.map((r) => (
                  <li key={r.id} className="border-b border-line-hair px-5 py-4 last:border-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="mono text-sm text-ink">{r.fiscalYear}</p>
                        <p className="mt-1 text-xs text-ink-3">
                          {t('Demand', 'বার্ষিক দাবি')} {taka(r.annualDemandBDT)}
                          {r.arrearAmountBDT > 0 && <> &middot; {t('arrears', 'বকেয়া')} {taka(r.arrearAmountBDT)}</>}
                        </p>
                      </div>
                      <StatusMark tone={STATUS_TONE[r.status]}>{getStatusText(r.status)}</StatusMark>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                      <p className="mono tnum text-xl font-semibold text-ink">
                        {r.status === 'PENDING' ? taka(r.totalDueBDT) : taka(r.paidAmountBDT)}
                      </p>
                      {r.status === 'PENDING' ? (
                        <Button variant="primary" size="sm" onClick={() => startPayment(r)}>
                          {t('Pay this bill', 'কর পরিশোধ করুন')}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="mono text-2xs text-ink-3">{r.dakhilaNumber}</span>
                          <Button size="sm" onClick={() => setReceipt(r)}>
                            {t('View Dakhila', 'দাখিলা দেখুন')}
                          </Button>
                        </div>
                      )}
                    </div>

                    {r.trxId && (
                      <p className="mono mt-2 text-2xs uppercase text-ink-3">
                        {r.paymentMethod} &middot; {r.trxId} &middot; {shortDate(r.paymentDate)}
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
            <Panel label={due ? t('Due Now', 'চলতি বকেয়া') : t('Nothing Due', 'কোনো বকেয়া নেই')}>
              {due ? (
                <>
                  <p className="mono tnum text-3xl font-semibold text-ink">{taka(due.totalDueBDT)}</p>
                  <p className="mt-1 text-sm text-ink-2">
                    {t(
                      `Land Development Tax for FY ${due.fiscalYear}`,
                      `${due.fiscalYear} অর্থবছরের ভূমি উন্নয়ন কর`
                    )}
                  </p>
                  <Button variant="primary" className="mt-5 w-full" onClick={() => startPayment(due)}>
                    {t(`Pay ${taka(due.totalDueBDT)}`, `${taka(due.totalDueBDT)} পরিশোধ করুন`)}
                  </Button>
                  <p className="mt-3 text-xs text-ink-3">
                    {t(
                      'You get an instant transaction reference before payment settles. Verified directly with Bangladesh Treasury.',
                      'পেমেন্ট নিষ্পত্তির পূর্বে আপনি নিশ্চিতকরণ রেফারেন্স পাবেন। সরাসরি সরকারি কোষাগারের সাথে সমন্বিত।'
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink">
                    {t('Every raised bill for this parcel is settled.', 'এই খতিয়ানের সকল ভূমি উন্নয়ন কর সম্পূর্ণ পরিশোধিত।')}
                  </p>
                  <p className="mt-2 text-xs text-ink-3">
                    {t(
                      'The next demand is raised at the start of the fiscal year, in Baishakh.',
                      'পরবর্তী অর্থবছরের কর দাবি বৈশাখ মাসে স্বয়ংক্রিয়ভাবে জারি হবে।'
                    )}
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
      {/* ---------------------------------------------------------- Payment Gateway */}
      {selectedForPayment && (
        <PaymentGatewayModal
          open={gatewayOpen}
          onClose={() => setGatewayOpen(false)}
          parcel={parcel}
          taxRecord={selectedForPayment}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

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
            <div id="printable-dakhila" className="relative overflow-hidden border border-line bg-sheet-raised p-6">
              {/* Official Seal Watermark */}
              <div className="pointer-events-none absolute right-4 top-16 select-none opacity-[0.04]">
                <ShieldCheck className="h-64 w-64 text-state" />
              </div>

              <div className="flex items-start justify-between gap-6 border-b border-line pb-4">
                <div>
                  <Eyebrow>Government of the People's Republic of Bangladesh &middot; Ministry of Land</Eyebrow>
                  <p className="bn mt-1 text-xl font-bold text-ink">ভূমি উন্নয়ন কর পরিশোধ রসিদ (দাখিলা)</p>
                  <p className="text-sm text-ink-2">Online Cadastral Tax Receipt &middot; Form No. 1077 (Rule 97)</p>
                </div>
                <div className="text-right">
                  <p className="mono text-2xs uppercase text-ink-3">দাখিলা ক্রমিক নম্বর (Dakhila No.)</p>
                  <p className="mono text-base font-bold text-indigo">{receipt.dakhilaNumber}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded bg-state-soft px-2 py-0.5 text-2xs font-semibold text-state">
                    <CheckCircle2 className="h-3 w-3" /> Reconciled with Treasury
                  </span>
                </div>
              </div>

              <div className="grid gap-6 py-5 sm:grid-cols-2">
                <div className="space-y-1">
                  <DataRow label="Parcel Unique ID" value={parcel.id} mono />
                  <DataRow label="Recorded Owner (মালিক)" value={parcel.currentOwner} />
                  <DataRow label="NID Card Number" value={parcel.nidNumber} mono />
                  <DataRow label="District & Upazila" value={`${parcel.district}, ${parcel.upazila}`} />
                  <DataRow label="Mouza & J.L. No." value={`${parcel.mouza} (J.L. #${parcel.jlNumber})`} />
                  <DataRow label="Khatian & Dag No." value={`খতিয়ান ${parcel.khatianNo} · দাগ ${parcel.dagNo}`} />
                  <DataRow label="Land Class & Area" value={`${parcel.landClass} (${parcel.areaDecimal} শতক)`} />
                </div>
                <div className="space-y-1">
                  <DataRow label="Fiscal Demand Year" value={receipt.fiscalYear} mono />
                  <DataRow label="Annual Demand" value={taka(receipt.annualDemandBDT)} mono />
                  <DataRow label="Arrears Settled" value={taka(receipt.arrearAmountBDT)} mono />
                  <DataRow label="Total Paid (পরিশোধিত)" value={<span className="font-bold text-state">{taka(receipt.paidAmountBDT || receipt.totalDueBDT)}</span>} mono />
                  <DataRow label="Payment Gateway" value={receipt.paymentMethod ?? 'bKash Digital'} />
                  <DataRow label="Treasury Trx Reference" value={receipt.trxId ?? '—'} mono />
                  <DataRow label="Date of Payment" value={shortDate(receipt.paymentDate)} mono />
                </div>
              </div>

              <div className="flex items-end justify-between gap-6 border-t border-line pt-4">
                <div className="w-44 shrink-0 opacity-80">
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
                  <div className="inline-flex items-center gap-1.5 rounded border border-state/40 bg-state-soft px-3 py-1.5 text-xs font-semibold text-state">
                    <ShieldCheck className="h-4 w-4" /> Digitally Signed by AC (Land)
                  </div>
                  <p className="mono mt-2 max-w-[260px] break-all text-2xs text-ink-3">
                    {receipt.qrCodeUrl || `https://land.gov.bd/verify/dakhila/${receipt.dakhilaNumber}`}
                  </p>
                  <p className="mt-1 text-2xs text-ink-3">Scan QR on verification counter or e-Parcha portal.</p>
                </div>
              </div>
            </div>

            <div className="no-print mt-5 flex gap-2">
              <Button className="flex-1" onClick={() => setReceipt(null)}>
                Close
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print দাখিলা
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
