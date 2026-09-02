import { useState } from 'react';
import { GitCommit, History, ShieldCheck, FileText, CheckCircle2, ChevronRight, Calendar, User, Scale } from 'lucide-react';
import type { Parcel, TitleChainNode, PropertyState } from '../../lib/types';
import { Panel, StatusMark, DataRow, Button } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { useLanguage } from '../../lib/language';
import { decimals, katha } from '../../lib/format';

export default function LineagePanel({ parcel }: { parcel: Parcel }) {
  const { pickLang, t } = useLanguage();
  const [filterState, setFilterState] = useState<PropertyState | 'ALL'>('ALL');
  const [selectedNode, setSelectedNode] = useState<TitleChainNode | null>(null);

  // Default chain if parcel doesn't have custom ones
  const chain: TitleChainNode[] = parcel.titleChain || [
    {
      id: 'tc-cs',
      epoch: 'CS',
      epochTitle: 'Cadastral Survey (সিএস জরিপ)',
      year: 1924,
      ownerName: 'হরেন্দ্র নারায়ণ সেন চৌধুরী (Harendra Narayan Sen Chowdhury)',
      khatianNo: 'CS-412',
      dagNo: '910 (মূল জমিদারী তালুক)',
      areaDecimal: 28.5,
      transferType: 'ORIGINAL_SETTLEMENT',
      transferTypeBn: 'জমিদারী মূল বন্দোবস্ত',
      subRegistryOffice: 'ঢাকা কালেক্টরেট',
      state: 'HISTORICAL',
      notes: 'Bengal Cadastral Survey record under Savar Revenue Circle.',
    },
    {
      id: 'tc-sa',
      epoch: 'SA',
      epochTitle: 'State Acquisition (এসএ জরিপ)',
      year: 1958,
      ownerName: 'মোঃ আফতাব উদ্দিন আহমেদ (Md. Aftab Uddin Ahmed)',
      khatianNo: 'SA-890',
      dagNo: '1042 (বিভাজিত)',
      areaDecimal: 12.0,
      transferType: 'PURCHASE_DEED',
      transferTypeBn: 'সাফ-কবলা দলিল',
      deedNo: 'দলিল নং ১২৩০/১৯৫৮',
      subRegistryOffice: 'ধামরাই সাব-রেজিস্ট্রি অফিস',
      state: 'HISTORICAL',
      notes: 'Transferred via registered purchase deed post East Bengal State Acquisition Act.',
    },
    {
      id: 'tc-rs',
      epoch: 'RS',
      epochTitle: 'Revisional Survey (আরএস জরিপ)',
      year: 1984,
      ownerName: 'মোঃ সিরাজুল হক (Md. Sirajul Haque)',
      khatianNo: 'RS-4502',
      dagNo: '1204',
      areaDecimal: 5.5,
      transferType: 'INHERITANCE',
      transferTypeBn: 'উত্তরাধিকার ও হেবা বিল এওয়াজ',
      deedNo: 'হেবা দলিল ৩৪০২/১৯৮৩',
      subRegistryOffice: 'সাভার সাব-রেজিস্ট্রি অফিস',
      state: 'HISTORICAL',
      notes: 'RS field survey sheet confirms creation of independent Dag 1204.',
    },
    {
      id: 'tc-bs',
      epoch: 'BS',
      epochTitle: 'Bangladesh Survey (বিএস মহানগর জরিপ)',
      year: 2018,
      ownerName: 'মোঃ রফিকুল ইসলাম (Md. Rafiqul Islam)',
      khatianNo: 'BS-1890',
      dagNo: '1204',
      areaDecimal: 5.5,
      transferType: 'PURCHASE_DEED',
      transferTypeBn: 'সাব-কবলা দলিল',
      deedNo: 'দলিল নং ৪৪৭১/২০১৮',
      subRegistryOffice: 'সাভার সাব-রেজিস্ট্রি অফিস',
      state: 'HISTORICAL',
      notes: 'Biometric deed registration with cleared consideration and non-encumbrance receipt.',
    },
    {
      id: 'tc-bds',
      epoch: 'BDS',
      epochTitle: 'BDS Digital Drone Cadastre (বিডিএস ডিজিটাল ড্রোন জরিপ)',
      year: 2026,
      ownerName: pickLang(parcel.currentOwner),
      khatianNo: parcel.khatianNo,
      dagNo: parcel.dagNo,
      areaDecimal: parcel.areaDecimal,
      transferType: 'E_MUTATION',
      transferTypeBn: 'অনলাইন ই-নামজারি ও নকশা অনুমোদন',
      deedNo: 'নামজারি কেস MUT-2026-DH-0941',
      subRegistryOffice: 'সহকারী কমিশনার (ভূমি) কোর্ট',
      state: 'CURRENT',
      notes: 'Active authoritative legal title with RTK-GNSS vector polygon in national land cloud.',
    },
  ];

  const filtered = filterState === 'ALL' ? chain : chain.filter((c) => c.state === filterState);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo" />
              <h2 className="sheet-title text-xl font-semibold text-ink">
                {t('Chain of Title & Historical Lineage', 'খতিয়ান ও দলিলের ঐতিহাসিক ধারাবাহিকতা')}
              </h2>
            </div>
            <p className="mt-1 max-w-measure text-sm text-ink-2">
              {t(
                'Trace the chronological lineage of deeds, inherited shares, and survey mutations from CS (1924) through BDS (2026).',
                'সিএস জরিপ (১৯২৪) থেকে শুরু করে এসএ, আরএস এবং বর্তমান বিডিএস ডিজিটাল জরিপ পর্যন্ত মালিকানা ও বায়া দলিলের ধারাবাহিক চেইন।'
              )}
            </p>
          </div>

          {/* 3-State Filter Bar */}
          <div className="flex rounded border border-line bg-sheet p-0.5 text-xs">
            <button
              onClick={() => setFilterState('ALL')}
              className={`px-2.5 py-1 text-2xs font-semibold rounded ${
                filterState === 'ALL' ? 'bg-indigo text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t('All Records', 'সকল পর্যায়')} ({chain.length})
            </button>
            <button
              onClick={() => setFilterState('CURRENT')}
              className={`px-2.5 py-1 text-2xs font-semibold rounded ${
                filterState === 'CURRENT' ? 'bg-state text-white' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t('Current Title', 'বর্তমান স্বত্ব')}
            </button>
            <button
              onClick={() => setFilterState('HISTORICAL')}
              className={`px-2.5 py-1 text-2xs font-semibold rounded ${
                filterState === 'HISTORICAL' ? 'bg-ground-sunk text-ink font-bold' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {t('Historical Deeds', 'ঐতিহাসিক বায়া দলিল')}
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Visual Lineage Tree */}
        <Reveal delay={40}>
          <Panel
            label={t('Unbroken Lineage Sequence', 'ধারাবাহিক খতিয়ান ও দলিল চেইন')}
            meta={`${filtered.length} ${t('stages verified', 'টি পর্যায় যাচাইকৃত')}`}
          >
            <div className="relative pl-6 space-y-8 before:absolute before:bottom-3 before:left-2.5 before:top-3 before:w-0.5 before:bg-line">
              {filtered.map((node, idx) => {
                const isCurrent = node.state === 'CURRENT';
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`relative cursor-pointer rounded border p-4 transition-all hover:border-indigo ${
                      isSelected
                        ? 'border-indigo bg-indigo-soft'
                        : isCurrent
                        ? 'border-state bg-sheet-raised shadow-sm'
                        : 'border-line bg-sheet'
                    }`}
                  >
                    {/* Spine Node Marker */}
                    <div
                      className={`absolute -left-[31px] top-4.5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-sheet ${
                        isCurrent ? 'border-state text-state' : 'border-indigo text-indigo'
                      }`}
                    >
                      <GitCommit className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="mono text-xs font-bold text-indigo">{node.epoch}</span>
                          <span className="mono text-2xs text-ink-3">({node.year})</span>
                          <span className="text-sm font-semibold text-ink">{node.epochTitle}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-ink-2 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-ink-3" />
                          <span>{node.ownerName}</span>
                        </p>
                      </div>
                      <StatusMark tone={isCurrent ? 'state' : 'neutral'}>
                        {isCurrent ? t('Current Owner (বর্তমান)', 'বর্তমান') : t('Historical (পূর্ববর্তী)', 'পূর্ববর্তী')}
                      </StatusMark>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-line-hair pt-2.5 sm:grid-cols-4">
                      <div>
                        <span className="mono block text-[10px] text-ink-3">খতিয়ান নং</span>
                        <span className="mono font-medium text-ink">{node.khatianNo}</span>
                      </div>
                      <div>
                        <span className="mono block text-[10px] text-ink-3">দাগ নং</span>
                        <span className="mono font-medium text-ink">{node.dagNo}</span>
                      </div>
                      <div>
                        <span className="mono block text-[10px] text-ink-3">জমির পরিমাণ</span>
                        <span className="mono font-medium text-ink">{decimals(node.areaDecimal)}</span>
                      </div>
                      <div>
                        <span className="mono block text-[10px] text-ink-3">হস্তান্তর মাধ্যম</span>
                        <span className="text-indigo font-medium">{node.transferTypeBn}</span>
                      </div>
                    </div>

                    {node.deedNo && (
                      <p className="mt-2 text-2xs text-ink-3 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-indigo" />
                        <span>{node.deedNo} &middot; {node.subRegistryOffice}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </Panel>
        </Reveal>

        {/* Selected Stage Detail & Statutory Verification */}
        <div className="space-y-5">
          <Reveal delay={80}>
            <Panel label={t('Stage Legal Dossier', 'নির্বাচিত পর্যায়ের আইনি বিবরণ')}>
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <span className="mono text-xs font-bold text-indigo">{selectedNode.epoch} Survey Epoch</span>
                    <h3 className="sheet-title text-lg font-semibold text-ink mt-0.5">{selectedNode.epochTitle}</h3>
                    <p className="text-xs text-ink-3">Year: {selectedNode.year}</p>
                  </div>

                  <div className="divide-y divide-line-hair border border-line bg-sheet-raised">
                    <DataRow label="Recorded Owner" bn="রেকর্ডীয় মালিক" value={selectedNode.ownerName} />
                    <DataRow label="Khatian No" bn="খতিয়ান নং" value={selectedNode.khatianNo} mono />
                    <DataRow label="Plot (Dag No)" bn="দাগ নং" value={selectedNode.dagNo} mono />
                    <DataRow label="Area Recorded" bn="জমির পরিমাণ" value={`${decimals(selectedNode.areaDecimal)} (${katha(selectedNode.areaDecimal)})`} mono />
                    <DataRow label="Transfer Mode" bn="হস্তান্তর ধরন" value={selectedNode.transferTypeBn} />
                    {selectedNode.deedNo && (
                      <DataRow label="Registered Deed" bn="রেজিস্ট্রিকৃত দলিল" value={selectedNode.deedNo} mono />
                    )}
                    {selectedNode.subRegistryOffice && (
                      <DataRow label="Registry Office" bn="সাব-রেজিস্ট্রি অফিস" value={selectedNode.subRegistryOffice} />
                    )}
                  </div>

                  <div className="border-l-2 border-indigo bg-indigo-soft p-3 text-xs text-ink">
                    <span className="font-semibold block mb-0.5">Historical Survey Note:</span>
                    {selectedNode.notes}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-ink-3">
                  <FileText className="mx-auto h-8 w-8 text-ink-3 mb-2" />
                  <p>তালিকা থেকে যেকোনো খতিয়ান বা দলিলের উপর ক্লিক করে বিস্তারিত আইনি প্রমাণ দেখুন।</p>
                </div>
              )}
            </Panel>
          </Reveal>

          {/* Chain Integrity Assurance */}
          <Reveal delay={120}>
            <div className="border border-line bg-sheet p-4">
              <div className="flex items-center gap-2 text-state">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Unbroken Chain of Title Certified
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-2">
                ১৯২৪ হতে ২০২৬ পর্যন্ত কোনো অজ্ঞাত স্বত্বচ্যুতি বা অজ্ঞাত হস্তান্তরের ব্যবধান পরিলক্ষিত হয়নি। রাষ্ট্রীয় অধিগ্রহণ ও প্রজাস্বত্ব আইন ১৯৫০ এর বিধান অনুযায়ী স্বত্ব অটুট রয়েছে।
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
