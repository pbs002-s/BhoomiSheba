import { useState } from 'react';
import { FileText, ShieldCheck, Eye, Calculator, AlertCircle } from 'lucide-react';
import type { LandDocument, Parcel } from '../../lib/types';
import { Button, DataRow, Panel, StatusMark } from '../../components/ui';
import { Reveal } from '../../components/motion';
import { useLanguage } from '../../lib/language';
import { decimals, sqft, maskNid, relativeDays, shortDate } from '../../lib/format';
import DocumentViewerModal from '../../components/DocumentViewerModal';
import LandCalculatorModal from '../../components/LandCalculatorModal';
import DisputeModal from '../../components/DisputeModal';

const EVENT_TONE: Record<string, 'state' | 'amber' | 'seal' | 'indigo'> = {
  MUTATION_APPROVED: 'state',
  TAX_PAID: 'state',
  MUTATION_SUBMITTED: 'amber',
  MUTATION_STAGE_UPDATE: 'indigo',
  DISPUTE_FILED: 'seal',
  DISCREPANCY_RESOLVED: 'state',
  ARREAR: 'seal',
  SURVEY: 'indigo',
  GIS_SURVEY: 'indigo',
};

export default function Overview({ parcel, onChanged }: { parcel: Parcel; onChanged?: () => void }) {
  const { lang, t, pickLang, formatKatha, formatBigha, formatArea } = useLanguage();
  const events = parcel.timelineEvents ?? [];
  const docs = parcel.documents ?? [];

  const [selectedDoc, setSelectedDoc] = useState<LandDocument | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Reveal>
            <Panel
              label={t('Ownership Record', 'মালিকানা রেকর্ড')}
              meta={parcel.khatianNo}
              action={
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setCalcOpen(true)}>
                    <Calculator className="h-3.5 w-3.5" /> {t('Unit Tools', 'পরিমাপক')}
                  </Button>
                </div>
              }
            >
              <DataRow label="Recorded owner" bn="মালিক" value={pickLang(parcel.currentOwner)} />
              <DataRow label="NID Number" bn="জাতীয় পরিচয়পত্র" value={maskNid(parcel.nidNumber)} mono />
              <DataRow label="Mobile" bn="মোবাইল নম্বর" value={parcel.phone} mono />
              <DataRow label="Land class" bn="শ্রেণি" value={pickLang(parcel.landClass)} />
              <DataRow label="Holding" bn="হোল্ডিং নং" value={parcel.holdingNo} mono />
              <DataRow
                label="Recorded area"
                bn="জমির পরিমাণ"
                value={formatArea(parcel.areaDecimal)}
                mono
              />
              <DataRow
                label="Katha & Bigha"
                bn="কাঠা ও বিঘা"
                value={`${formatKatha(parcel.areaDecimal)} · ${formatBigha(parcel.areaDecimal)}`}
                mono
              />
              <DataRow label="Total Square Feet" bn="বর্গফুট" value={sqft(parcel.areaDecimal)} mono />
              {parcel.mappedAreaDecimal !== undefined && (
                <DataRow
                  label="Digitized Area"
                  bn="নকশাকৃত পরিমাণ"
                  value={formatArea(parcel.mappedAreaDecimal)}
                  mono
                />
              )}
            </Panel>
          </Reveal>

          <Reveal delay={80}>
            <Panel
              label={t('Cadastral Location', 'মৌজা ও ভৌগোলিক অবস্থান')}
              meta={`JL ${parcel.jlNumber}`}
              action={
                <Button size="sm" onClick={() => setDisputeOpen(true)}>
                  <AlertCircle className="h-3.5 w-3.5" /> {t('Lodge Dispute', 'অভিযোগ দাখিল')}
                </Button>
              }
            >
              <DataRow label="Division" bn="বিভাগ" value={parcel.division} />
              <DataRow label="District" bn="জেলা" value={parcel.district} />
              <DataRow label="Upazila" bn="উপজেলা" value={parcel.upazila} />
              <DataRow label="Mouza" bn="মৌজা" value={parcel.mouza} />
              <DataRow label="Dag No" bn="দাগ নং" value={parcel.dagNo} mono />
            </Panel>
          </Reveal>
        </div>

        <div className="space-y-5">
          <Reveal delay={40}>
            <Panel
              label={t('Activity & Judicial History', 'কার্যক্রম ও বিচারিক ইতিহাস')}
              meta={`${events.length} ${t('events', 'টি ঘটনা')}`}
            >
              {events.length === 0 ? (
                <p className="text-sm text-ink-3">
                  {t(
                    'Nothing recorded against this parcel yet. Events appear here as offices act on it.',
                    'এই রেকর্ডে এখনো কোনো নতুন কার্যক্রম নেই।'
                  )}
                </p>
              ) : (
                <ol className="relative space-y-0">
                  {events.map((e, i) => (
                    <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                      {/* the spine: a survey chain down the left */}
                      <span className="flex flex-col items-center">
                        <span className="mt-1.5 h-2 w-2 shrink-0 border border-indigo bg-sheet" />
                        {i < events.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-ink">{pickLang(e.title)}</span>
                          <span className="mono text-2xs text-ink-3">
                            {shortDate(e.eventDate)} · {relativeDays(e.eventDate)}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-ink-2">{pickLang(e.description)}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="mono text-2xs uppercase text-ink-3">{pickLang(e.actor)}</span>
                          {e.referenceDoc && (
                            <StatusMark tone={EVENT_TONE[e.eventType] ?? 'neutral'}>{e.referenceDoc}</StatusMark>
                          )}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={120}>
            <Panel
              label={t('Document Vault & OCR', 'ডিজিটাল নথি ও ওসিয়ার')}
              bodyClassName="px-0 py-0"
              meta={`${docs.length} ${t('files', 'টি নথি')}`}
            >
              {docs.length === 0 ? (
                <p className="px-5 py-5 text-sm text-ink-3">No documents attached to this parcel.</p>
              ) : (
                <ul>
                  {docs.map((d) => (
                    <li
                      key={d.id}
                      onClick={() => setSelectedDoc(d)}
                      className="group flex cursor-pointer items-center justify-between gap-3 border-b border-line-hair px-5 py-3 transition-colors last:border-0 hover:bg-ground-sunk"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-indigo" />
                        <span className="min-w-0">
                          <span className="bn block text-sm font-semibold text-ink group-hover:text-indigo">
                            {d.docType}
                          </span>
                          <span className="mono block truncate text-2xs text-ink-3">{d.fileName}</span>
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="mono shrink-0 text-2xs text-ink-3">{shortDate(d.uploadedAt)}</span>
                        <Eye className="h-3.5 w-3.5 text-ink-3 group-hover:text-indigo" />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </Reveal>

          <Reveal delay={160}>
            <div className="flex gap-3 border border-line bg-sheet px-4 py-3.5">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-state" />
              <p className="text-xs text-ink-3">
                Authoritative record synchronized with Ministry of Land & DLRS National Cadastre.
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        document={selectedDoc}
        parcel={parcel}
      />

      {/* Land Calculator Modal */}
      <LandCalculatorModal
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        initialDecimal={parcel.areaDecimal}
      />

      {/* Dispute Modal */}
      <DisputeModal
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        parcelId={parcel.id}
        defaultOwner={parcel.currentOwner}
        defaultPhone={parcel.phone}
        onSuccess={() => {
          if (onChanged) onChanged();
        }}
      />
    </>
  );
}
