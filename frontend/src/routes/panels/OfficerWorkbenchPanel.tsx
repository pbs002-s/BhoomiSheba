import { useState, useEffect } from 'react';
import {
  Landmark,
  Scale,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  ShieldAlert,
  Send,
  ArrowRight,
  XCircle,
  FolderOpen,
  Filter,
  Check,
  Building,
  RefreshCw,
} from 'lucide-react';
import type { Parcel, Mutation, Discrepancy } from '../../lib/types';
import { Panel, Button, StatusMark, inputClass } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { useLanguage } from '../../lib/language';
import { shortDate, taka, decimals } from '../../lib/format';
import { advanceMutation, resolveFlag, sendSimulatedSms, readSession } from '../../lib/api';

interface Props {
  parcels: Parcel[];
  onSelectParcel: (parcelId: string) => void;
  onRefresh: () => void;
}

type SubTab = 'cause-list' | 'mutations' | 'discrepancies' | 'field-reports';

export default function OfficerWorkbenchPanel({ parcels, onSelectParcel, onRefresh }: Props) {
  const { t, pickLang } = useLanguage();
  const session = readSession();
  const [tab, setTab] = useState<SubTab>('cause-list');
  const [selectedCase, setSelectedCase] = useState<{ mutation: Mutation; parcel: Parcel } | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [resolvingFlag, setResolvingFlag] = useState<{ discrepancy: Discrepancy; parcel: Parcel } | null>(null);
  const [flagModalOpen, setFlagModalOpen] = useState(false);

  // Form states for Judicial Order Modal
  const [orderAction, setOrderAction] = useState<'ADVANCE' | 'REJECT'>('ADVANCE');
  const [hearingDate, setHearingDate] = useState<string>('');
  const [orderNote, setOrderNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states for Discrepancy Resolution Modal
  const [flagResolutionNote, setFlagResolutionNote] = useState('');

  // Collect all mutations across jurisdiction parcels
  const allMutations: Array<{ mutation: Mutation; parcel: Parcel }> = [];
  parcels.forEach((p) => {
    (p.mutations ?? []).forEach((m) => {
      allMutations.push({ mutation: m, parcel: p });
    });
  });

  // Collect all discrepancies across jurisdiction parcels
  const allDiscrepancies: Array<{ discrepancy: Discrepancy; parcel: Parcel }> = [];
  parcels.forEach((p) => {
    (p.discrepancies ?? []).forEach((d) => {
      allDiscrepancies.push({ discrepancy: d, parcel: p });
    });
  });

  // Filter for Daily Cause List (Cases scheduled for hearing or pending notice)
  const causeListCases = allMutations.filter(
    (item) => item.mutation.status !== 'APPROVED' && item.mutation.status !== 'REJECTED'
  );

  const pendingDiscrepancies = allDiscrepancies.filter((item) => !item.discrepancy.isResolved);

  const handleOpenOrderModal = (m: Mutation, p: Parcel) => {
    setSelectedCase({ mutation: m, parcel: p });
    setOrderAction('ADVANCE');
    setOrderNote('');
    setHearingDate(
      m.status === 'KANUNGO_VERIFICATION'
        ? new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
        : ''
    );
    setOrderModalOpen(true);
  };

  const handleExecuteRuling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setSubmitting(true);

    try {
      await advanceMutation(selectedCase.mutation.id, selectedCase.parcel.id, {
        action: orderAction === 'REJECT' ? 'REJECT' : undefined,
        officerNote: orderNote.trim() || undefined,
      });

      // Send SMS notice to citizen
      await sendSimulatedSms({
        recipientPhone: selectedCase.mutation.applicantPhone || selectedCase.parcel.phone,
        senderId: 'BHUMISHEBA',
        messageText: `ভূমি রাজস্ব আদালত আদেশ: মামলা নং ${selectedCase.mutation.caseNumber} এ বিজ্ঞ সহকারী কমিশনার (ভূমি) কর্তৃক আদেশ প্রদান করা হয়েছে। বিস্তারিত জানতে আপনার ড্যাশবোর্ডে লগইন করুন।`,
        type: 'MUTATION_ACTIVITY',
      });

      setOrderModalOpen(false);
      setSelectedCase(null);
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFlagModal = (d: Discrepancy, p: Parcel) => {
    setResolvingFlag({ discrepancy: d, parcel: p });
    setFlagResolutionNote('সরেজমিন ড্রোন ও ফিল্ড ভেরিফিকেশন মোতাবেক রেকর্ড হালনাগাদ ও নিষ্পত্তি করা হলো।');
    setFlagModalOpen(true);
  };

  const handleExecuteFlagResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingFlag) return;
    setSubmitting(true);

    try {
      await resolveFlag(resolvingFlag.discrepancy.id, resolvingFlag.parcel.id, flagResolutionNote);
      setFlagModalOpen(false);
      setResolvingFlag(null);
      onRefresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatchSmsNotice = async (m: Mutation, p: Parcel) => {
    await sendSimulatedSms({
      recipientPhone: m.applicantPhone || p.phone,
      senderId: 'BHUMISHEBA',
      messageText: `জরুরি শুনানী নোটিশ: নামজারি মামলা নং ${m.caseNumber}, মৌজা: ${p.mouza}। সহকারী কমিশনার (ভূমি) এর আদালতে শুনানীর জন্য পক্ষগণকে উপস্থিত হতে নির্দেশ প্রদান করা যাচ্ছে।`,
      type: 'MUTATION_ACTIVITY',
    });
    alert(`শুনানীর ক্ষুদেবার্তা সফলভাবে ${m.applicantPhone || p.phone} নম্বরে প্রেরণ করা হয়েছে।`);
  };

  return (
    <div className="space-y-6">
      {/* Officer Court Session Masthead */}
      <Reveal>
        <div className="border border-indigo/30 bg-indigo-soft p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-indigo/40 bg-sheet text-indigo shadow-sm">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono rounded bg-indigo px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-white">
                    {t('Revenue Court Active', 'রাজস্ব আদালত সেশন চলমান')}
                  </span>
                  <span className="mono text-2xs font-semibold text-ink-3">
                    Office Code: DLRS-DH-SAV-01
                  </span>
                </div>
                <h1 className="sheet-title text-xl font-bold text-ink sm:text-2xl mt-1">
                  {t('Assistant Commissioner (Land) Judicial Workbench', 'সহকারী কমিশনার (ভূমি) এর রাজস্ব আদালত ও কর্মক্ষেত্র')}
                </h1>
                <p className="mt-0.5 text-xs text-ink-2">
                  <strong>{session?.name || 'Farhana Akter, AC (Land)'}</strong> &middot;{' '}
                  <span>{session?.office || 'Savar Upazila Revenue Circle, Dhaka'}</span> &middot;{' '}
                  <span className="text-state font-semibold">Executive Magistrate Jurisdiction</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
                {t('Refresh Queue', 'রিফ্রেশ করুন')}
              </Button>
            </div>
          </div>

          {/* Quick KPI Strip */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-indigo/20 pt-4 sm:grid-cols-5">
            <div className="rounded border border-line bg-sheet p-3">
              <span className="mono block text-[10px] uppercase text-ink-3">
                {t('Jurisdiction Records', 'এলাকাধীন খতিয়ান')}
              </span>
              <span className="mono text-2xl font-bold text-ink">{parcels.length}</span>
              <span className="block text-[11px] text-ink-3">{t('Loaded in Circle', 'টি সার্কেল রেকর্ড')}</span>
            </div>

            <div className="rounded border border-line bg-sheet p-3">
              <span className="mono block text-[10px] uppercase text-ink-3">
                {t('Active Mutation Cases', 'চলমান নামজারি মামলা')}
              </span>
              <span className="mono text-2xl font-bold text-indigo">{causeListCases.length}</span>
              <span className="block text-[11px] text-indigo font-medium">{t('Pending rulings', 'টি বিচারিক নিষ্পত্তিতে')}</span>
            </div>

            <div className="rounded border border-line bg-sheet p-3">
              <span className="mono block text-[10px] uppercase text-ink-3">
                {t('Hearing Cause List', 'দৈনিক শুনানী কজ লিস্ট')}
              </span>
              <span className="mono text-2xl font-bold text-amber">
                {causeListCases.filter((c) => c.mutation.status === 'AC_LAND_HEARING').length || 1}
              </span>
              <span className="block text-[11px] text-amber font-medium">{t('Scheduled hearings', 'টি শুনানী তালিকাভুক্ত')}</span>
            </div>

            <div className="rounded border border-line bg-sheet p-3">
              <span className="mono block text-[10px] uppercase text-ink-3">
                {t('Cadastral Flags', 'গরমিল ও সীমানা বিরোধ')}
              </span>
              <span className="mono text-2xl font-bold text-seal">{pendingDiscrepancies.length}</span>
              <span className="block text-[11px] text-seal font-medium">{t('Survey orders due', 'টি তদন্তাদেশ অপেক্ষমাণ')}</span>
            </div>

            <div className="rounded border border-line bg-sheet p-3">
              <span className="mono block text-[10px] uppercase text-ink-3">
                {t('Disposal SLA Rate', 'গড় নিষ্পত্তি সময়')}
              </span>
              <span className="mono text-2xl font-bold text-state">18 {t('Days', 'দিন')}</span>
              <span className="block text-[11px] text-state font-medium">{t('Under 28-day SLA', 'নাগরিক চার্টার মানদণ্ড')}</span>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
        {[
          { id: 'cause-list' as const, label: t('Daily Cause List & Hearings', 'দৈনিক কার্যতালিকা ও শুনানী'), icon: Calendar, badge: causeListCases.length },
          { id: 'mutations' as const, label: t('e-Mutation Docket', 'নামজারি মামলা রেজিস্টার'), icon: Scale, badge: allMutations.length },
          { id: 'discrepancies' as const, label: t('Discrepancy & Dispute Bench', 'গরমিল ও বিরোধ নিষ্পত্তি'), icon: AlertTriangle, badge: pendingDiscrepancies.length },
          { id: 'field-reports' as const, label: t('Field Reports & Kanungo', 'তহশিলদার ও কানুনগো রিপোর্ট'), icon: FileText },
        ].map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center justify-between p-3.5 text-left transition-colors duration-1 ${active ? 'bg-indigo-soft text-indigo font-semibold' : 'bg-sheet text-ink-2 hover:bg-ground-sunk'
                }`}
            >
              <div className="flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${active ? 'text-indigo' : 'text-ink-3'}`} />
                <span className="text-xs">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`mono rounded px-1.5 py-0.5 text-2xs font-bold ${active ? 'bg-indigo text-white' : 'bg-ground-sunk text-ink-2'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Daily Cause List */}
      {tab === 'cause-list' && (
        <Reveal delay={40}>
          <Panel
            label={t('AC (Land) Daily Cause List (দৈনিক কার্যতালিকা)', 'বিজ্ঞ সহকারী কমিশনার (ভূমি) এর দৈনিক কার্যতালিকা')}
            meta={`${causeListCases.length} ${t('cases listed', 'টি মামলা কার্যতালিকাভুক্ত')}`}
            bodyClassName="px-0 py-0"
          >
            {causeListCases.length === 0 ? (
              <p className="p-6 text-center text-xs text-ink-3">
                {t('No pending cases on the cause list for today.', 'আজকের কজ লিস্টে কোনো শুনানী অপেক্ষমাণ নেই।')}
              </p>
            ) : (
              <div className="divide-y divide-line-hair">
                {causeListCases.map(({ mutation: m, parcel: p }) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-ground-sunk lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-xs font-bold text-indigo">{m.caseNumber}</span>
                        <span className="mono rounded bg-ground px-1.5 py-0.5 text-2xs text-ink-3">
                          {p.upazila}, মৌজা {p.mouza} &middot; দাগ {p.dagNo}
                        </span>
                        <StatusMark
                          tone={m.status === 'AC_LAND_HEARING' ? 'amber' : m.status === 'KANUNGO_VERIFICATION' ? 'neutral' : 'state'}
                        >
                          {m.status.replace(/_/g, ' ')}
                        </StatusMark>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink">
                        <span>
                          <span className="text-ink-3">আবেদনকারী:</span> <strong>{m.applicantName}</strong>
                        </span>
                        <span>
                          <span className="text-ink-3">রেকর্ডীয় মালিক:</span> <strong>{p.currentOwner}</strong>
                        </span>
                        <span>
                          <span className="text-ink-3">প্রস্তাবিত মালিক:</span> <strong className="text-indigo">{m.proposedOwner}</strong>
                        </span>
                      </div>

                      <p className="text-xs text-ink-2">
                        <strong>বর্তমান পর্যায়:</strong> {m.currentStage}
                      </p>

                      {m.hearingDate && (
                        <p className="mono text-2xs text-amber font-semibold flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          শুনানীর তারিখ: {shortDate(m.hearingDate)} &middot; সকাল ১১:০০ ঘটিকা
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-center shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => onSelectParcel(p.id)}>
                        <FolderOpen className="h-3.5 w-3.5" />
                        {t('Open Parcel', 'নথি দেখুন')}
                      </Button>
                      <Button size="sm" onClick={() => handleDispatchSmsNotice(m, p)}>
                        <Send className="h-3.5 w-3.5" />
                        {t('Notice SMS', 'নোটিশ জারি')}
                      </Button>
                      <Button size="sm" variant="primary" onClick={() => handleOpenOrderModal(m, p)}>
                        <Scale className="h-3.5 w-3.5" />
                        {t('Pass Order', 'বিচারিক আদেশ দিন')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Reveal>
      )}

      {/* Tab 2: Full e-Mutation Docket */}
      {tab === 'mutations' && (
        <Reveal delay={40}>
          <Panel
            label={t('Complete Mutation Register', 'সার্কেল নামজারি ও জমা খারিজ রেজিস্টার')}
            meta={`${allMutations.length} ${t('total records', 'টি নথি নথিভুক্ত')}`}
            bodyClassName="px-0 py-0"
          >
            <div className="divide-y divide-line-hair">
              {allMutations.map(({ mutation: m, parcel: p }) => {
                const isApproved = m.status === 'APPROVED';
                const isRejected = m.status === 'REJECTED';
                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 p-5 transition-colors hover:bg-ground-sunk lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono text-xs font-bold text-indigo">{m.caseNumber}</span>
                        <span className="mono text-2xs text-ink-3">
                          {p.id} &middot; {p.upazila}
                        </span>
                        <StatusMark tone={isApproved ? 'state' : isRejected ? 'seal' : 'amber'}>
                          {m.status.replace(/_/g, ' ')}
                        </StatusMark>
                      </div>
                      <p className="mt-1 text-xs text-ink">
                        {m.applicantName} ➔ <strong className="text-indigo">{m.proposedOwner}</strong>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-2">{m.currentStage}</p>
                      {m.remarks && <p className="mt-1 text-2xs italic text-ink-3">{m.remarks}</p>}
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      <Button size="sm" onClick={() => onSelectParcel(p.id)}>
                        <FolderOpen className="h-3.5 w-3.5" />
                        {t('View Record', 'রেকর্ড')}
                      </Button>
                      {!isApproved && !isRejected && (
                        <Button size="sm" variant="primary" onClick={() => handleOpenOrderModal(m, p)}>
                          <Scale className="h-3.5 w-3.5" />
                          {t('Judicial Ruling', 'আদেশ')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </Reveal>
      )}

      {/* Tab 3: Cadastral Discrepancy & Dispute Bench */}
      {tab === 'discrepancies' && (
        <Reveal delay={40}>
          <Panel
            label={t('Cadastral & Title Discrepancy Bench', 'গরমিল ও সীমানা বিরোধ নিষ্পত্তি বেঞ্চ')}
            meta={`${pendingDiscrepancies.length} ${t('unresolved flags', 'টি অমীমাংসিত গরমিল')}`}
            bodyClassName="px-0 py-0"
          >
            {allDiscrepancies.length === 0 ? (
              <p className="p-6 text-center text-xs text-ink-3">কোনো গরমিল চিহ্নিত হয়নি।</p>
            ) : (
              <div className="divide-y divide-line-hair">
                {allDiscrepancies.map(({ discrepancy: d, parcel: p }) => (
                  <div
                    key={d.id}
                    className="flex flex-col gap-3 p-5 transition-colors hover:bg-ground-sunk lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="mono rounded bg-ground px-1.5 py-0.5 text-2xs font-semibold text-indigo">
                          {p.id} (দাগ {p.dagNo})
                        </span>
                        <StatusMark tone={d.isResolved ? 'state' : d.severity === 'HIGH' ? 'seal' : 'amber'}>
                          {d.isResolved ? 'RESOLVED' : `${d.severity} SEVERITY`}
                        </StatusMark>
                      </div>

                      <h4 className="text-sm font-semibold text-ink">{d.mismatchType}</h4>

                      <div className="grid gap-1 text-xs sm:grid-cols-2 text-ink-2 bg-ground-sunk p-2.5 rounded border border-line-hair">
                        <div>
                          <span className="mono text-[10px] text-ink-3 uppercase block">Source A:</span>
                          {d.sourceA}
                        </div>
                        <div>
                          <span className="mono text-[10px] text-ink-3 uppercase block">Source B:</span>
                          {d.sourceB}
                        </div>
                      </div>

                      <p className="mono text-2xs text-ink-3">
                        চিহ্নিতকারী: {d.flaggedBy} &middot; তারিখ: {shortDate(d.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                      <Button size="sm" onClick={() => onSelectParcel(p.id)}>
                        <FolderOpen className="h-3.5 w-3.5" />
                        {t('Inspect Plot', 'জমি পরিদর্শন')}
                      </Button>
                      {!d.isResolved && (
                        <Button size="sm" variant="primary" onClick={() => handleOpenFlagModal(d, p)}>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t('Issue Resolution Order', 'নিষ্পত্তি আদেশ দিন')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </Reveal>
      )}

      {/* Tab 4: Field Reports & Kanungo */}
      {tab === 'field-reports' && (
        <Reveal delay={40}>
          <div className="space-y-4">
            <Panel label={t('Kanungo & ULAO Field Inquiry Dossiers', 'কানুনগো ও ইউনিয়ন ভূমি সহকারী কর্মকর্তার সরেজমিন তদন্ত প্রতিবেদন')}>
              <div className="space-y-4 text-xs text-ink-2">
                <div className="rounded border border-line bg-sheet-raised p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="mono font-bold text-indigo">কেস MUT-2026-DH-1044 &middot; সরেজমিন তদন্ত প্রতিবেদন</span>
                    <StatusMark tone="state">তদন্ত রিপোর্ট দাখিলকৃত</StatusMark>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 pt-1">
                    <div>
                      <span className="text-ink-3 block">তদন্তকারী কর্মকর্তা:</span>
                      <strong>মোঃ নাজমুল হোসেন, কানুনগো</strong>
                    </div>
                    <div>
                      <span className="text-ink-3 block">সরেজমিন দখলদারিত্ব:</span>
                      <strong>ওয়ারিশ সূত্রে আবেদনকারী দখলে আছেন</strong>
                    </div>
                    <div>
                      <span className="text-ink-3 block">সীমানা খুঁটি ও পরিমাপ:</span>
                      <strong>উত্তর-দক্ষিণে সঠিক, বিরোধ মুক্ত</strong>
                    </div>
                  </div>
                  <p className="pt-2 text-ink-2 bg-ground-sunk p-2.5 rounded border border-line-hair">
                    <strong>কানুনগো মন্তব্য:</strong> সরেজমিন পরিমাপে দাগ নং ১২০৪ এর উত্তর পার্শ্বে ওয়ারিশ সূত্রে কামাল হোসেনের ২.৪১ শতক দখল পাওয়া গেছে। প্রজাস্বত্ব আইন ১৯৫০ এর ১৪৩ ধারা অনুযায়ী নামজারি মঞ্জুরে কোনো আইনি বাধা পরিলক্ষিত হয়নি।
                  </p>
                </div>

                <div className="rounded border border-line bg-sheet-raised p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-line pb-2">
                    <span className="mono font-bold text-indigo">কেস MUT-2026-SYL-0519 &middot; চা বাগান সংলগ্ন তদন্ত প্রতিবেদন</span>
                    <StatusMark tone="amber">শুনানী নোটিশ কার্যকর</StatusMark>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 pt-1">
                    <div>
                      <span className="text-ink-3 block">তদন্তকারী কর্মকর্তা:</span>
                      <strong>শ্রীমঙ্গল ইউনিয়ন ভূমি সহকারী কর্মকর্তা (তহশিলদার)</strong>
                    </div>
                    <div>
                      <span className="text-ink-3 block">জমির শ্রেণি ও প্রকৃতি:</span>
                      <strong>বাস্তব দখলে কৃষি নাল জমি (৪৫ শতক)</strong>
                    </div>
                    <div>
                      <span className="text-ink-3 block">সহ-অংশীদার নোটিশ:</span>
                      <strong>তামিল হয়েছে, কোনো লিখিত আপত্তি দাখিল হয়নি</strong>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>
          </div>
        </Reveal>
      )}

      {/* Judicial Order Ruling Modal */}
      {orderModalOpen && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg border border-line bg-sheet p-6 shadow-xl animate-sheet-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-indigo">
                <Scale className="h-5 w-5" />
                <h3 className="sheet-title text-base font-semibold text-ink">
                  {t('Pass Judicial Order (বিচারিক আদেশনামা)', 'বিচারিক আদেশনামা প্রদান')}
                </h3>
              </div>
              <button onClick={() => setOrderModalOpen(false)} className="text-ink-3 hover:text-ink">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteRuling} className="mt-4 space-y-4 text-xs">
              <div className="bg-indigo-soft p-3 rounded border border-indigo/20">
                <p className="font-semibold text-indigo">
                  মামলা নং {selectedCase.mutation.caseNumber}
                </p>
                <p className="text-2xs text-ink-2 mt-0.5">
                  মৌজা: {selectedCase.parcel.mouza} &middot; দাগ: {selectedCase.parcel.dagNo} &middot; আবেদনকারী: {selectedCase.mutation.applicantName}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1.5">
                  বিচারিক সিদ্ধান্ত (Judicial Action):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderAction('ADVANCE')}
                    className={`p-2.5 text-center border rounded ${orderAction === 'ADVANCE'
                        ? 'border-indigo bg-indigo-soft text-indigo font-bold'
                        : 'border-line text-ink-2'
                      }`}
                  >
                    ✓ পর্যায় অনুমোদন ও অগ্রসর
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderAction('REJECT')}
                    className={`p-2.5 text-center border rounded ${orderAction === 'REJECT'
                        ? 'border-seal bg-seal-soft text-seal font-bold'
                        : 'border-line text-ink-2'
                      }`}
                  >
                    ✕ আবেদন খারিজ / বাতিল
                  </button>
                </div>
              </div>

              {orderAction === 'ADVANCE' && selectedCase.mutation.status === 'KANUNGO_VERIFICATION' && (
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    আদালতে শুনানীর তারিখ নির্ধারণ (Fix Hearing Date):
                  </label>
                  <input
                    type="date"
                    value={hearingDate}
                    onChange={(e) => setHearingDate(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-ink mb-1">
                  সরকারি আদেশনামা নোট (Official AC Land Order Sheet Note):
                </label>
                <textarea
                  rows={3}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder={
                    orderAction === 'ADVANCE'
                      ? 'সরেজমিন কানুনগো তদন্ত প্রতিবেদন ও নথিপত্র পর্যালোচনা অন্তে নামজারি কার্যকর করার আদেশ দেওয়া হলো।'
                      : 'বায়া দলিলের স্বত্ব ধারাবাহিকতা না থাকায় আবেদনটি খারিজ করা হলো।'
                  }
                  className={`${inputClass} w-full font-sans`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button size="sm" type="button" onClick={() => setOrderModalOpen(false)}>
                  বাতিল (Cancel)
                </Button>
                <Button size="sm" variant={orderAction === 'ADVANCE' ? 'primary' : 'secondary'} type="submit" disabled={submitting}>
                  {submitting ? 'আদেশ নথিভুক্ত হচ্ছে...' : 'বিচারিক আদেশ কার্যকর করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discrepancy Resolution Modal */}
      {flagModalOpen && resolvingFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg border border-line bg-sheet p-6 shadow-xl animate-sheet-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2 text-indigo">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="sheet-title text-base font-semibold text-ink">
                  {t('Resolve Cadastral Discrepancy', 'গরমিল ও সীমানা বিরোধ নিষ্পত্তি')}
                </h3>
              </div>
              <button onClick={() => setFlagModalOpen(false)} className="text-ink-3 hover:text-ink">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteFlagResolution} className="mt-4 space-y-4 text-xs">
              <div className="bg-ground-sunk p-3 rounded border border-line">
                <p className="font-semibold text-ink">{resolvingFlag.discrepancy.mismatchType}</p>
                <p className="text-2xs text-ink-3 mt-1">
                  খতিয়ান: {resolvingFlag.parcel.khatianNo} &middot; দাগ: {resolvingFlag.parcel.dagNo} &middot; এলাকা: {resolvingFlag.parcel.upazila}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-ink mb-1">
                  সহকারী কমিশনার (ভূমি) এর নিষ্পত্তিমূলক আদেশ (Resolution Order):
                </label>
                <textarea
                  rows={3}
                  value={flagResolutionNote}
                  onChange={(e) => setFlagResolutionNote(e.target.value)}
                  className={`${inputClass} w-full font-sans`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button size="sm" type="button" onClick={() => setFlagModalOpen(false)}>
                  বাতিল (Cancel)
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'নিষ্পত্তি হচ্ছে...' : 'নিষ্পত্তি সম্পন্ন করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
