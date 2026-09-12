import React, { useRef } from 'react';
import { Printer, ShieldCheck, X, QrCode } from 'lucide-react';
import type { DueDiligenceReport, Parcel } from '../lib/types';
import { Button } from './ui';
import { shortDate, decimals, katha, sqft, maskNid } from '../lib/format';
import { useLanguage } from '../lib/language';

import { printDocument, openPrintWindow } from '../lib/print';

interface Props {
  open: boolean;
  onClose: () => void;
  parcel: Parcel;
  report: DueDiligenceReport;
}

export default function ClearanceCertificateModal({ open, onClose, parcel, report }: Props) {
  const { pickLang } = useLanguage();
  const printRef = useRef<HTMLDivElement | null>(null);

  if (!open) return null;

  const handlePrint = () => {
    printDocument('printable-clearance-certificate', `Clearance-Certificate-${report.verificationHash || parcel.id}`);
  };

  const isApproved = report.overallVerdict === 'APPROVED_FOR_TRANSACTION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/70 p-4 backdrop-blur-sm print:p-0 print:bg-transparent">
      <div className="relative my-8 w-full max-w-3xl border border-line bg-sheet shadow-2xl print:my-0 print:border-0 print:shadow-none">
        {/* Action Header - Hidden on Print */}
        <div className="flex items-center justify-between border-b border-line bg-ground px-6 py-3 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo" />
            <span className="mono text-xs font-semibold uppercase text-ink">
              Official Clearance Certificate (অনাপত্তি সনদ)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="primary" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> প্রিন্ট / সংরক্ষণ (Print PDF)
            </Button>
            <button
              onClick={onClose}
              className="rounded p-1 text-ink-3 transition-colors hover:bg-ground-sunk hover:text-ink"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Certificate Area */}
        <div id="printable-clearance-certificate" ref={printRef} className="p-6 sm:p-10 print:p-4 bg-white text-neutral-900 font-sans">
          {/* Government Watermark & Seal Header */}
          <div className="text-center border-b-2 border-emerald-800 pb-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900/10 text-emerald-800">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <h2 className="mt-2 text-base font-bold tracking-wide text-emerald-900">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকার
            </h2>
            <h3 className="text-xs font-semibold text-neutral-700">
              ভূমি মন্ত্রণালয় — ভূমি রেকর্ড ও জরিপ অধিদপ্তর (DLRS)
            </h3>
            <p className="mono mt-1 text-xs text-neutral-500">
              অফিসিয়াল প্রি-পারচেজ ডিউ ডিলিজেন্স ও ভূমি স্বত্ব যাচাই সনদপত্র
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 mono text-[11px] font-semibold text-neutral-800">
              <span>সনদ নং: {report.verificationHash}</span> &middot;{' '}
              <span>ইস্যুর তারিখ: {shortDate(report.generatedAt)}</span>
            </div>
          </div>

          {/* Certificate Verdict Banner */}
          <div className={`mt-6 rounded-md border p-4 text-center ${
            isApproved 
              ? 'border-emerald-700 bg-emerald-50 text-emerald-900' 
              : 'border-amber-700 bg-amber-50 text-amber-900'
          }`}>
            <span className="text-xs font-bold uppercase tracking-wider block">
              {isApproved 
                ? '✓ জমি ক্রয়-বিক্রয় ও নামজারি অনাপত্তি প্রাপ্ত (APPROVED FOR TRANSACTION)'
                : '⚠️ সতর্কীকরণ — শর্তসাপেক্ষ নিষ্পত্তি প্রয়োজন (CONDITIONAL RESOLUTION REQUIRED)'}
            </span>
            <p className="mt-1 text-xs">
              জাতীয় ভূমি ডেটাবেজ, আরএস/বিএস খতিয়ান ও সাব-রেজিস্ট্রি দলিলের স্বয়ংক্রিয় অডিটে এই রেকর্ডটির স্কোর{' '}
              <strong className="mono font-bold text-sm">{report.score}/১০০</strong>।
            </p>
          </div>

          {/* Parcel Particulars Table */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-300 pb-1 mb-2">
              জমির সুনির্দিষ্ট বিবরণ (Certified Property Particulars)
            </h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">অনন্য পার্সেল আইডি (UPID):</span>
                <span className="mono font-bold text-neutral-900">{parcel.id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">রেকর্ডকৃত মালিক:</span>
                <span className="font-semibold text-neutral-900">{pickLang(parcel.currentOwner)}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">মালিকের এনআইডি:</span>
                <span className="mono font-medium text-neutral-900">{maskNid(parcel.nidNumber)}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">খতিয়ান নম্বর:</span>
                <span className="mono font-semibold text-neutral-900">{parcel.khatianNo}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">দাগ নম্বর:</span>
                <span className="mono font-semibold text-neutral-900">{parcel.dagNo}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">মৌজা ও জেএল:</span>
                <span className="font-medium text-neutral-900">{parcel.mouza}, JL {parcel.jlNumber}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">উপজেলা ও জেলা:</span>
                <span className="font-medium text-neutral-900">{parcel.upazila}, {parcel.district}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">জমির শ্রেণি:</span>
                <span className="font-medium text-neutral-900">{pickLang(parcel.landClass)}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">জমির পরিমাণ:</span>
                <span className="mono font-bold text-neutral-900">
                  {decimals(parcel.areaDecimal)} ({katha(parcel.areaDecimal)}) &middot; {sqft(parcel.areaDecimal)}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 py-1">
                <span className="text-neutral-500">ডিজিটাল নকশাকৃত পরিমাণ:</span>
                <span className="mono font-bold text-neutral-900">
                  {parcel.mappedAreaDecimal ? decimals(parcel.mappedAreaDecimal) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* 7-Point Audit Breakdown */}
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-300 pb-1 mb-2">
              ৭-দফা স্বয়ংক্রিয় ডিউ ডিলিজেন্স অডিট রিপোর্ট (7-Point Audit Checklist)
            </h4>
            <div className="space-y-2">
              {report.items.map((it, idx) => (
                <div key={it.id} className="flex items-start justify-between border-b border-neutral-100 pb-2 text-xs">
                  <div className="pr-4">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                      <span>{idx + 1}. {it.nameBn}</span>
                      <span className="mono text-[10px] text-neutral-400">({it.statuteRef})</span>
                    </div>
                    <p className="mt-0.5 text-neutral-600">{it.finding}</p>
                  </div>
                  <span className={`mono shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                    it.status === 'PASS' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {it.status === 'PASS' ? '✓ উত্তীর্ণ (PASS)' : '⚠️ সতর্কতা (CHECK)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic QR & Signatures Footer */}
          <div className="mt-8 flex items-end justify-between border-t-2 border-neutral-300 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center border border-neutral-300 bg-neutral-50 p-1">
                <QrCode className="h-16 w-16 text-neutral-800" />
              </div>
              <div className="text-[10px] text-neutral-500 max-w-[240px]">
                <p className="font-semibold text-neutral-800">যাচাইকরণ কিউআর কোড</p>
                <p className="mono mt-0.5">ডিজিটাল স্বাক্ষর যাচাই করতে স্ক্যান করুন। কোনো ম্যানুয়াল স্বাক্ষরের প্রয়োজন নেই।</p>
                <p className="mono mt-0.5 text-emerald-800">gov.bd/verify/clearance</p>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="inline-block border-t border-neutral-400 pt-1 text-center">
                <p className="font-bold text-neutral-900">স্বয়ংক্রিয় ডিজিটাল প্রত্যয়ন</p>
                <p className="text-[11px] text-neutral-600">সহকারী কমিশনার (ভূমি) কার্যালয়</p>
                <p className="mono text-[10px] text-neutral-400">স্মার্ট ভূমি সেবা অটোমেশন নোড</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
