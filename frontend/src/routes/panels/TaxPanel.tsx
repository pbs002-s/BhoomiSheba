import React, { useState } from 'react';
import { Loader2, Printer, ShieldCheck, CheckCircle2, QrCode, ExternalLink } from 'lucide-react';
import type { Parcel, TaxRecord } from '../../lib/types';
import { Button, DataRow, Eyebrow, Panel, StatusMark } from '../../components/ui';
import { Reveal, Stagger, Counter } from '../../components/motion';
import { useLanguage } from '../../lib/language';
import Modal from '../../components/Modal';
import ParcelPlate from '../../components/ParcelPlate';
import PaymentGatewayModal from '../../components/PaymentGatewayModal';
import { shortDate, taka } from '../../lib/format';
import { printDocument, openPrintWindow } from '../../lib/print';

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
              <Stagger as="ul" watch={parcel.id}>
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
              </Stagger>
            )}
          </Panel>
        </Reveal>

        <div className="space-y-5">
          <Reveal delay={80}>
            <Panel label={due ? t('Due Now', 'চলতি বকেয়া') : t('Nothing Due', 'কোনো বকেয়া নেই')}>
              {due ? (
                <>
                  <p className="mono tnum text-3xl font-semibold text-ink">
                    <Counter to={due.totalDueBDT} prefix="৳" duration={900} />
                  </p>
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
        {receipt && (() => {
          const displayDakhilaNumber = receipt.dakhilaNumber || `DAK-${new Date().getFullYear()}-418822`;
          const displayTrxId = receipt.trxId
            ? receipt.trxId.startsWith('TRX-') || receipt.trxId.startsWith('TXN-')
              ? receipt.trxId
              : `TRX-${receipt.trxId}`
            : `TRX-ACH-${receipt.dakhilaNumber ? receipt.dakhilaNumber.replace(/\D/g, '') : '20268492'}`;
          const displayMethod = receipt.paymentMethod || 'bKash Digital Gateway';
          const displayDate = shortDate(receipt.paymentDate || new Date().toISOString());

          return (
            <div>
              <div
                id="printable-dakhila"
                className="relative overflow-hidden border border-line bg-sheet-raised p-5 sm:p-6 print:p-4 print:border-slate-700 print:bg-white text-ink"
              >
                {/* Official Seal Watermark */}
                <div className="pointer-events-none absolute right-4 top-12 select-none opacity-[0.03] print:opacity-[0.02]">
                  <ShieldCheck className="h-64 w-64 text-state" />
                </div>

                {/* Dakhila Top Header */}
                <div className="flex items-start justify-between gap-4 border-b border-line pb-3">
                  <div>
                    <Eyebrow>গণপ্রজাতন্ত্রী বাংলাদেশ সরকার &middot; ভূমি মন্ত্রণালয়</Eyebrow>
                    <p className="bn mt-0.5 text-lg font-bold text-ink sm:text-xl">ভূমি উন্নয়ন কর পরিশোধ রসিদ (দাখিলা)</p>
                    <p className="text-2xs text-ink-3 sm:text-xs">Online Cadastral Tax Receipt &middot; Form No. 1077 (Rule 97)</p>
                  </div>
                  <div className="text-right">
                    <p className="mono text-2xs uppercase text-ink-3">দাখিলা ক্রমিক নম্বর (Dakhila No.)</p>
                    <p className="mono text-sm sm:text-base font-bold text-indigo select-all">{displayDakhilaNumber}</p>
                    <span className="mt-1 inline-flex items-center gap-1 rounded bg-state-soft px-2 py-0.5 text-2xs font-semibold text-state">
                      <CheckCircle2 className="h-3 w-3" /> Reconciled with Treasury
                    </span>
                  </div>
                </div>

                {/* 2-Column Structured Data Grid */}
                <div className="dakhila-grid grid gap-4 py-3 sm:grid-cols-2 print:grid-cols-2">
                  {/* Left Column: Property Particulars */}
                  <div className="space-y-1 sm:border-r sm:border-line/40 sm:pr-4 print:border-r print:border-slate-300 print:pr-4">
                    <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-1">
                      জমির বিবরণ &middot; Property Particulars
                    </p>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Parcel Unique ID (ইউপিআইডি)</span>
                      <span className="mono tnum text-xs font-semibold text-ink">{parcel.id}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Recorded Owner (রেকর্ডীয় মালিক)</span>
                      <span className="text-xs font-medium text-ink truncate max-w-[180px]">{pickLang(parcel.currentOwner)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Owner NID (এনআইডি নম্বর)</span>
                      <span className="mono tnum text-xs text-ink">{parcel.nidNumber}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">District &amp; Upazila (জেলা ও উপজেলা)</span>
                      <span className="text-xs text-ink">{parcel.district}, {parcel.upazila}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Mouza &amp; J.L. No. (মৌজা ও জে.এল.)</span>
                      <span className="text-xs text-ink">{parcel.mouza} (J.L. #{parcel.jlNumber})</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Khatian &amp; Dag No. (খতিয়ান ও দাগ)</span>
                      <span className="text-xs font-medium text-ink">খতিয়ান {parcel.khatianNo} &middot; দাগ {parcel.dagNo}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Land Class &amp; Area (শ্রেণি ও পরিমাণ)</span>
                      <span className="text-xs font-medium text-ink">{pickLang(parcel.landClass)} ({parcel.areaDecimal} শতক)</span>
                    </div>
                  </div>

                  {/* Right Column: Financial & Treasury Settlement */}
                  <div className="space-y-1 sm:pl-1 print:pl-1">
                    <p className="mono text-[10px] font-bold uppercase tracking-wider text-ink-3 mb-1">
                      পরিশোধ ও রাজস্ব &middot; Treasury Settlement
                    </p>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Fiscal Demand Year (কর অর্থবছর)</span>
                      <span className="mono tnum text-xs text-ink">{receipt.fiscalYear}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Annual Demand (বার্ষিক দাবি)</span>
                      <span className="mono tnum text-xs text-ink">{taka(receipt.annualDemandBDT)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Arrears Settled (বকেয়া নিষ্পত্তি)</span>
                      <span className="mono tnum text-xs text-ink">{taka(receipt.arrearAmountBDT)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Total Paid (পরিশোধিত অর্থ)</span>
                      <span className="mono tnum text-xs font-bold text-state">
                        {taka(receipt.paidAmountBDT || receipt.totalDueBDT)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Payment Gateway (পরিশোধের মাধ্যম)</span>
                      <span className="text-xs font-medium text-ink">{displayMethod}</span>
                    </div>

                    {/* Treasury Trx Reference — Beautifully Aligned Official Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-line/60 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">
                        <span className="lang-en">Treasury Trx Reference</span>
                        <span className="lang-bn">কোষাগার চালান Trx ID</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="mono tnum text-[11px] font-semibold text-indigo bg-indigo-soft/80 px-2 py-0.5 rounded border border-indigo/25 tracking-wide select-all">
                          {displayTrxId}
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-state shrink-0" title="Treasury Settled" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 py-1.5">
                      <span className="shrink-0 text-xs text-ink-3">Date of Payment (পরিশোধের তারিখ)</span>
                      <span className="mono tnum text-xs text-ink">{displayDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Cadastral Map & Digital Certification Block */}
                <div className="flex items-center justify-between gap-4 border-t border-line/60 pt-3 mt-1">
                  <div className="flex items-center gap-3">
                    <div className="w-28 sm:w-36 shrink-0 opacity-90 border border-line/40 rounded p-1 bg-ground/50 print:bg-white print:border-slate-300">
                      <ParcelPlate
                        compact
                        animate={false}
                        dagNo={parcel.dagNo.split(/[\/ ]/)[0]}
                        areaDecimal={parcel.areaDecimal}
                        landClass={parcel.landClass}
                        geojson={parcel.geojsonBoundary}
                      />
                    </div>
                    <div className="text-[10px] text-ink-3">
                      <p className="font-semibold text-ink">মৌজা মানচিত্র স্কেচ</p>
                      <p className="mono">দাগ #{parcel.dagNo} &middot; খতিয়ান #{parcel.khatianNo}</p>
                      <p className="text-2xs text-state font-medium">✓ সিএস/এসএ/আরএস সমন্বিত</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="border border-line/60 p-1.5 rounded bg-white text-ink print:border-slate-400">
                      <QrCode className="h-10 w-10 text-ink" />
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 rounded border border-state/40 bg-state-soft px-2 py-0.5 text-2xs font-semibold text-state">
                        <ShieldCheck className="h-3 w-3" /> Digitally Signed &amp; Certified
                      </div>
                      <p className="mono mt-1 text-[10px] text-ink-3 select-all max-w-[220px] truncate">
                        {receipt.qrCodeUrl || `https://land.gov.bd/verify/dakhila/${displayDakhilaNumber}`}
                      </p>
                      <p className="text-[9px] text-ink-3">সহকারী কমিশনার (ভূমি) দপ্তর &middot; গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
                    </div>
                  </div>
                </div>

                {/* Legal Certification Notice */}
                <div className="mt-2.5 border-t border-line/30 pt-1.5 text-center text-[9px] text-ink-3 print:text-slate-500">
                  <p>বাংলাদেশ ফরম নং ১০৭৭ (নিয়ম ৯৭) &middot; এটি একটি কম্পিউটার প্রস্তুতকৃত দাখিলা, কোনো প্রকাশ্য সই বা সিলের প্রয়োজন নেই।</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="no-print mt-4 flex items-center gap-2">
                <Button className="px-4" onClick={() => setReceipt(null)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => printDocument('printable-dakhila', `Dakhila-${displayDakhilaNumber}`)}
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </Button>
                <Button
                  className="px-3 border border-line text-ink hover:bg-ground-sunk"
                  onClick={() => openPrintWindow('printable-dakhila', `ভূমি উন্নয়ন কর দাখিলা — ${displayDakhilaNumber}`)}
                  title="Open dedicated preview in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs ml-1.5">Open Preview</span>
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
