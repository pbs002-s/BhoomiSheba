import { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, FileCheck, RefreshCw, Printer, ExternalLink, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Parcel, DueDiligenceReport } from '../../lib/types';
import { getDueDiligence } from '../../lib/api';
import { Button, Panel, StatusMark, DataRow } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { useLanguage } from '../../lib/language';
import { shortDate, decimals, katha, sqft } from '../../lib/format';
import ClearanceCertificateModal from '../../components/ClearanceCertificateModal';

export default function DueDiligencePanel({ parcel }: { parcel: Parcel }) {
  const { pickLang, t } = useLanguage();
  const [report, setReport] = useState<DueDiligenceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    const data = await getDueDiligence(parcel.id);
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [parcel.id]);

  const isApproved = report?.overallVerdict === 'APPROVED_FOR_TRANSACTION';
  const isCaution = report?.overallVerdict === 'CAUTION_REQUIRED';

  return (
    <div className="space-y-6">
      {/* Top Banner / Verdict Header */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo" />
              <h2 className="sheet-title text-xl font-semibold text-ink">
                {t('Pre-Purchase Due Diligence & Title Clearance', 'জমি ক্রয়-বিক্রয় অনাপত্তি ও যাচাইকরণ')}
              </h2>
            </div>
            <p className="mt-1 max-w-measure text-sm text-ink-2">
              {t(
                'Comprehensive 7-point automated audit verifying ownership lineage, PostGIS boundary match, tax clearance, mortgage encumbrance, and litigation caveats.',
                'দলিল রেজিস্ট্রি ও নামজারির পূর্বে জাতীয় ডাটাবেজ, খতিয়ান চেইন, ড্রোন নকশা ও রাজস্ব আদালতের স্বয়ংক্রিয় ৭-দফা যাচাই।'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={loadReport} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? t('Auditing...', 'যাচাই চলছে...') : t('Re-Audit', 'পুনরায় যাচাই')}
            </Button>
            {report && (
              <Button size="sm" variant="primary" onClick={() => setCertModalOpen(true)}>
                <Printer className="h-3.5 w-3.5" />
                {t('Issue Clearance Certificate', 'অনাপত্তি সনদপত্র দেখুন')}
              </Button>
            )}
          </div>
        </div>
      </Reveal>

      {/* Main Scorecard and Summary Strip */}
      {report && (
        <Reveal delay={40}>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="border border-line bg-sheet-raised p-4">
              <span className="mono block text-2xs uppercase text-ink-3">
                {t('Title Health Score', 'স্বত্ব ও রেকর্ড স্কোর')}
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="mono text-3xl font-bold text-ink">{report.score}</span>
                <span className="mono text-sm text-ink-3">/ 100</span>
              </div>
              <div className="mt-3 h-1.5 w-full bg-ground-sunk rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${report.score >= 80 ? 'bg-state' : report.score >= 60 ? 'bg-amber' : 'bg-seal'
                    }`}
                  style={{ width: `${report.score}%` }}
                />
              </div>
            </div>

            <div className="border border-line bg-sheet-raised p-4">
              <span className="mono block text-2xs uppercase text-ink-3">
                {t('Transaction Eligibility', 'লেনদেন ও ক্রয় যোগ্যতা')}
              </span>
              <div className="mt-2">
                <StatusMark tone={isApproved ? 'state' : isCaution ? 'amber' : 'seal'}>
                  {isApproved
                    ? t('Approved for Transaction', 'ক্রয়-বিক্রয় নিরাপদ ও অনুমোদিত')
                    : isCaution
                      ? t('Caution Required', 'শর্তসাপেক্ষ নিষ্পত্তি প্রয়োজন')
                      : t('Disputed / Restricted', 'স্থগিত বা বিতর্কিত রেকর্ড')}
                </StatusMark>
              </div>
              <p className="mt-2 text-xs text-ink-2">
                {isApproved
                  ? t('No civil stay orders, mortgage charges, or unrectified boundary disputes.', 'কোনো দেওয়ানী স্থগিতাদেশ, ব্যাংক দায় বা অপরিশোধিত কর নেই।')
                  : t('Review flagged warning items prior to token deed earnest payment.', 'বায়না বা রেজিস্ট্রি সম্পাদনের পূর্বে অমিল শর্তসমূহ সংশোধন করুন।')}
              </p>
            </div>

            <div className="border border-line bg-sheet-raised p-4">
              <span className="mono block text-2xs uppercase text-ink-3">
                {t('Cryptographic Verification', 'ডিজিটাল সত্যায়ন ট্র্যাকার')}
              </span>
              <p className="mono mt-2 text-xs font-semibold text-indigo truncate" title={report.verificationHash}>
                {report.verificationHash}
              </p>
              <p className="mt-2 text-2xs text-ink-3">
                {t('Verified on', 'যাচাইয়ের সময়')}: {shortDate(report.generatedAt)} &middot; DLRS Cloud Node
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {/* 7-Point Audit Checklist Grid */}
      {report && (
        <Reveal delay={80}>
          <Panel
            label={t('7-Point Automated Pre-Purchase Checklist', '৭-দফা প্রি-পারচেজ ডিউ ডিলিজেন্স চেকলিস্ট')}
            meta={`${report.items.filter((i) => i.status === 'PASS').length} / ${report.items.length} ${t('Passed', 'উত্তীর্ণ')}`}
            bodyClassName="px-0 py-0"
          >
            <div className="divide-y divide-line-hair">
              {report.items.map((it, idx) => {
                const pass = it.status === 'PASS';
                return (
                  <div
                    key={it.id}
                    className="flex flex-col gap-2 p-4 transition-colors hover:bg-ground-sunk sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {pass ? (
                          <CheckCircle2 className="h-5 w-5 text-state" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">
                            {idx + 1}. {pickLang(it.nameBn)} ({it.name})
                          </span>
                          <span className="mono rounded bg-ground px-1.5 py-0.5 text-[10px] text-ink-3">
                            {it.statuteRef}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-2">{it.finding}</p>
                        <p className="mt-0.5 text-2xs text-ink-3">{it.detail}</p>
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0">
                      <StatusMark tone={pass ? 'state' : 'amber'}>
                        {pass ? t('Pass (উত্তীর্ণ)', 'উত্তীর্ণ') : t('Caution (সতর্কতা)', 'সতর্কতা')}
                      </StatusMark>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </Reveal>
      )}

      {/* Buyer Guidance Notes */}
      <Reveal delay={120}>
        <div className="border border-line bg-sheet p-5">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-indigo" />
            {t('Buyer Guidance & Legal Safeguards (ক্রেতার করণীয় সতর্কতা)', 'ক্রেতার করণীয় ও আইনি সতর্কতা')}
          </h3>
          <ul className="mt-3 space-y-2 text-xs text-ink-2">
            <li className="flex items-start gap-2">
              <span className="text-indigo font-bold">১.</span>
              <span>
                <strong>বায়া দলিলের ধারাবাহিকতা যাচাই:</strong> সিএস হতে বর্তমান বিএস/বিডিএস পর্যন্ত ন্যূনতম ২৫ বছরের স্বত্ব ও মালিকানার ধারাবাহিকতা মিল নিশ্চিত করুন।
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo font-bold">২.</span>
              <span>
                <strong>সরেজমিনে সীমানা ও দখল:</strong> নকশায় উল্লিখিত উত্তর-দক্ষিণ-পূর্ব-পশ্চিমের সীমানা খুঁটি এবং পাশ্ববর্তী দাগের সাথে বাস্তব দখল মিলিয়ে নিন।
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo font-bold">৩.</span>
              <span>
                <strong>সাব-রেজিস্ট্রি অফিসে তল্লাশি:</strong> দলিল সম্পাদনের অব্যবহিত পূর্বে সংশ্লিষ্ট সাব-রেজিস্ট্রি অফিসে কোনো অগ্রিম বায়না বা গোপন দানপত্র রেজিস্ট্রি রয়েছে কিনা তল্লাশি দিন।
              </span>
            </li>
          </ul>
        </div>
      </Reveal>

      {/* Clearance Certificate Modal */}
      {report && (
        <ClearanceCertificateModal
          open={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          parcel={parcel}
          report={report}
        />
      )}
    </div>
  );
}
