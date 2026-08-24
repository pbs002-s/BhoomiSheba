import { useState } from 'react';
import { PhoneCall, Calculator, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button, Panel, StatusMark } from '../../components/ui';
import { Reveal } from '../../components/motion';
import LandCalculatorModal from '../../components/LandCalculatorModal';
import DisputeModal from '../../components/DisputeModal';
import type { Parcel } from '../../lib/types';

const JOBS = [
  {
    en: 'Real-Time Property Activity Radar',
    bn: 'রেকর্ডে পরিবর্তন হলে তাত্ক্ষণিক বার্তা',
    detail: 'Automated SMS notification whenever a mutation, caveat, or mortgage lien is filed against your parcel.',
    when: 'Real-Time Event',
    tone: 'state' as const,
  },
  {
    en: 'Automated Payment Settlement & Reconciliation',
    bn: 'পেমেন্ট স্বয়ংক্রিয় সমন্বয়',
    detail: 'Every land tax transaction is verified against bKash, Nagad, Rocket or Ekpay gateway before issuing cryptographic Dakhila.',
    when: 'Within 30s',
    tone: 'state' as const,
  },
  {
    en: 'PostGIS Spatial Alignment Audit',
    bn: 'নকশা ও ভৌগোলিক সীমানা অডিট',
    detail: 'Continuous geometric reconciliation comparing digitised mouza sheets against drone cadastral vector polygons.',
    when: 'Hourly CDC',
    tone: 'indigo' as const,
  },
  {
    en: 'e-Mutation Judicial Lifecycle Dispatch',
    bn: 'ই-নামজারি ট্র্যাকিং ও নোটিশ',
    detail: 'Automated workflow managing Kanungo spot survey assignment, hearing notices, and DCR payment verification.',
    when: 'On State Change',
    tone: 'indigo' as const,
  },
  {
    en: 'Seasonal LD Tax Demand Assessment',
    bn: 'বাৎসরিক ভূমি কর নোটিশ',
    detail: 'Tax calculation raised automatically at the beginning of the Bengali fiscal year (Pohela Baishakh).',
    when: 'Annual Baishakh',
    tone: 'amber' as const,
  },
  {
    en: 'Cryptographic Dakhila QR Verification',
    bn: 'যাচাইযোগ্য ডিজিটাল দাখিলা',
    detail: 'Generates tamper-proof QR code signatures verifiable by banks, sub-registry vaults, and revenue courts.',
    when: 'On Payment',
    tone: 'state' as const,
  },
];

export default function ServicesPanel({ parcel }: { parcel: Parcel }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  return (
    <>
      <div className="space-y-5">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <h2 className="sheet-title text-xl font-semibold text-ink">Land Services & Automation Engine</h2>
              <p className="mt-1 max-w-measure text-sm text-ink-2">
                Automated government pipelines and citizen self-service tools operating continuously in the background.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setCalcOpen(true)}>
                <Calculator className="h-3.5 w-3.5" /> Land Tools
              </Button>
              <Button size="sm" variant="primary" onClick={() => setDisputeOpen(true)}>
                <AlertTriangle className="h-3.5 w-3.5" /> 16122 Dispute
              </Button>
            </div>
          </div>
        </Reveal>

        {/* Quick Service Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="border border-line bg-sheet-raised p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="h-5 w-5 text-indigo" />
                <div>
                  <p className="text-sm font-semibold text-ink">Land Service Helpline 16122</p>
                  <p className="bn text-xs text-ink-3">ভূমি সেবা হটলাইন (১৬১২২)</p>
                </div>
              </div>
              <StatusMark tone="state">24/7 Active</StatusMark>
            </div>
            <p className="mt-2 text-xs text-ink-2">
              Toll-free 24/7 hotline for land queries, corruption reporting, and live e-Mutation application support.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href="tel:16122"
                className="inline-flex items-center gap-1.5 border border-line bg-sheet px-3 py-1.5 text-xs font-semibold text-indigo hover:bg-ground-sunk"
              >
                <PhoneCall className="h-3 w-3" /> Call 16122
              </a>
              <Button size="sm" onClick={() => setDisputeOpen(true)}>
                Lodge Online Ticket
              </Button>
            </div>
          </div>

          <div className="border border-line bg-sheet-raised p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Calculator className="h-5 w-5 text-indigo" />
                <div>
                  <p className="text-sm font-semibold text-ink">Land Measurement & Faraez</p>
                  <p className="bn text-xs text-ink-3">ভূমি পরিমাপক ও ফারায়েজ বণ্টন</p>
                </div>
              </div>
              <StatusMark tone="indigo">DLRS Toolkit</StatusMark>
            </div>
            <p className="mt-2 text-xs text-ink-2">
              Standard unit conversions (শতক, কাঠা, বিঘা, একর, বর্গফুট) and Islamic inheritance distribution calculator.
            </p>
            <div className="mt-3">
              <Button size="sm" onClick={() => setCalcOpen(true)}>
                Open Land Calculator
              </Button>
            </div>
          </div>
        </div>

        {/* 6 Automated Background Pipeline Jobs */}
        <div className="grid gap-px border border-line bg-line sm:grid-cols-2">
          {JOBS.map((j, i) => (
            <Reveal key={j.en} delay={i * 50} className="bg-sheet px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">{j.en}</p>
                  <p className="bn mt-0.5 text-xs text-ink-3">{j.bn}</p>
                </div>
                <StatusMark tone={j.tone}>{j.when}</StatusMark>
              </div>
              <p className="mt-2 text-xs text-ink-2">{j.detail}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <Panel label="System Infrastructure & Microservices" meta="production ready">
            <div className="grid gap-x-8 sm:grid-cols-2">
              {[
                ['API Gateway', 'Express 4.19 · Node.js 20 · :5000'],
                ['Spatial Database', 'PostgreSQL 15 + PostGIS (WGS84) · :5433'],
                ['Automation Engine', 'n8n Event-Driven Webhooks · :5678'],
                ['Payment Reconciler', 'Multi-Gateway Webhook Ingress (bKash/Nagad/Ekpay)'],
              ].map(([k, v]) => (
                <p key={k} className="flex justify-between gap-4 border-b border-line-hair py-2 text-sm last:border-0">
                  <span className="text-ink-3">{k}</span>
                  <span className="mono text-xs text-ink">{v}</span>
                </p>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-3">
              <ShieldCheck className="h-3.5 w-3.5 text-state" />
              <span>Full offline demonstration fallback enabled for zero-downtime exploration.</span>
            </div>
          </Panel>
        </Reveal>
      </div>

      <LandCalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} initialDecimal={parcel.areaDecimal} />
      <DisputeModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        parcelId={parcel.id}
        defaultOwner={parcel.currentOwner}
        defaultPhone={parcel.phone}
      />
    </>
  );
}
