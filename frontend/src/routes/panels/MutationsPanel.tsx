import React, { useRef, useState } from 'react';
import { Loader2, CheckCircle2, ArrowRight, XCircle } from 'lucide-react';
import type { Mutation, MutationStatus, Parcel } from '../../lib/types';
import { advanceMutation, readSession } from '../../lib/api';
import { Button, Panel, StatusMark, inputClass } from '../../components/ui';
import { Reveal, Stagger } from '../../components/motion';
import Modal, { useDialogA11y } from '../../components/Modal';
import MutationWizard from '../../components/MutationWizard';
import { cx, shortDate, taka } from '../../lib/format';

const STAGES: Array<{ key: MutationStatus; en: string; bn: string }> = [
  { key: 'SUBMITTED', en: 'Filed', bn: 'আবেদন' },
  { key: 'KANUNGO_VERIFICATION', en: 'Field survey', bn: 'সরেজমিন' },
  { key: 'AC_LAND_HEARING', en: 'Hearing', bn: 'শুনানি' },
  { key: 'DCR_PAYMENT_PENDING', en: 'DCR payment', bn: 'ডিসিআর' },
];

const stageIndex = (status: MutationStatus) => {
  if (status === 'APPROVED') return STAGES.length;
  if (status === 'REJECTED') return -1;
  return STAGES.findIndex((s) => s.key === status);
};

function StageTrack({ status }: { status: MutationStatus }) {
  const idx = stageIndex(status);
  const rejected = status === 'REJECTED';

  return (
    <ol className="mt-4 grid grid-cols-4 gap-px border border-line bg-line">
      {STAGES.map((s, i) => {
        const done = !rejected && i < idx;
        const active = !rejected && i === idx;
        return (
          <li
            key={s.key}
            className={cx(
              'bg-sheet px-2.5 py-2.5',
              active && 'bg-indigo-soft',
              done && 'bg-state-soft'
            )}
          >
            <span
              className={cx(
                'mono block text-2xs',
                done ? 'text-state' : active ? 'text-indigo' : 'text-ink-3'
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={cx('mt-1 block text-xs font-medium', active || done ? 'text-ink' : 'text-ink-3')}>
              {s.en}
            </span>
            <span className="bn block text-2xs text-ink-3">{s.bn}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function MutationsPanel({ parcel, onChanged }: { parcel: Parcel; onChanged: () => void }) {
  const session = readSession();
  const isOfficer = session?.role === 'officer';

  const mutations = parcel.mutations ?? [];
  const [open, setOpen] = useState(false);
  const [filed, setFiled] = useState<Mutation | null>(null);

  // Officer Judicial Modal State
  const [selectedMutation, setSelectedMutation] = useState<Mutation | null>(null);
  const [orderAction, setOrderAction] = useState<'ADVANCE' | 'REJECT'>('ADVANCE');
  const [orderNote, setOrderNote] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const judicialModalRef = useRef<HTMLDivElement | null>(null);
  useDialogA11y(!!selectedMutation, () => setSelectedMutation(null), judicialModalRef);

  const handleWizardDone = (mutation: Mutation) => {
    setOpen(false);
    setFiled(mutation);
    onChanged();
  };

  const handleOpenOrder = (m: Mutation, action: 'ADVANCE' | 'REJECT') => {
    setSelectedMutation(m);
    setOrderAction(action);
    setOrderNote(
      action === 'REJECT'
        ? 'বায়া দলিলের ধারাবাহিকতা ও রেকর্ড সন্তোষজনক না হওয়ায় নামজারি আবেদন খারিজ করা হলো।'
        : 'সরেজমিন তদন্ত ও রেকর্ডীয় কাগজপত্র সঠিক থাকায় আবেদন মঞ্জুর ও পরবর্তী ধাপে প্রেরণের আদেশ প্রদান করা হলো।'
    );
    setHearingDate(
      m.status === 'KANUNGO_VERIFICATION'
        ? new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
        : ''
    );
  };

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMutation) return;
    setSubmittingOrder(true);
    await advanceMutation(selectedMutation.id, parcel.id, {
      action: orderAction === 'REJECT' ? 'REJECT' : undefined,
      officerNote: orderNote.trim() || undefined,
    });
    setSubmittingOrder(false);
    setSelectedMutation(null);
    onChanged();
  };


  return (
    <>
      <div className="space-y-5">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="sheet-title text-xl font-semibold text-ink">নামজারি (e-Mutation)</h2>
                {isOfficer && (
                  <span className="border border-indigo/40 bg-indigo-soft px-2 py-0.5 text-2xs font-semibold text-indigo">
                    Officer Workbench
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-2">
                Authoritative judicial workflow for land ownership transfer, khatian issuance, and AC (Land) court hearings.
              </p>
            </div>
            <Button variant="primary" onClick={() => setOpen(true)}>
              File a নামজারি
            </Button>
          </div>
        </Reveal>

        {mutations.length === 0 ? (
          <Reveal>
            <Panel label="No Active Applications">
              <p className="text-sm text-ink">Nobody has applied to change this record.</p>
              <p className="mt-2 text-sm text-ink-2">
                If an application is submitted by any co-sharer or buyer, it appears here and SMS notice is dispatched automatically.
              </p>
            </Panel>
          </Reveal>
        ) : (
          <Stagger watch={parcel.id} className="space-y-5">
            {mutations.map((m) => (
              <Panel key={m.id} label={m.caseNumber} meta={shortDate(m.createdAt)}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink">
                      <span className="text-ink-3">From</span> <span className="font-semibold">{m.applicantName}</span>{' '}
                      <span className="text-ink-3">to</span> <span className="font-semibold text-indigo">{m.proposedOwner}</span>
                    </p>
                    <p className="mt-1 text-sm text-ink-2">{m.currentStage}</p>
                  </div>
                  <StatusMark
                    tone={m.status === 'APPROVED' ? 'state' : m.status === 'REJECTED' ? 'seal' : 'amber'}
                  >
                    {m.status.replace(/_/g, ' ').toLowerCase()}
                  </StatusMark>
                </div>

                <StageTrack status={m.status} />

                <div className="mt-4 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                  <p className="flex justify-between border-b border-line-hair py-2 text-sm">
                    <span className="text-ink-3">Judicial Hearing</span>
                    <span className="mono text-ink">{m.hearingDate ? shortDate(m.hearingDate) : 'Pending notice'}</span>
                  </p>
                  <p className="flex justify-between border-b border-line-hair py-2 text-sm">
                    <span className="text-ink-3">DCR Fee</span>
                    <span className="mono text-ink">{taka(m.dcrAmount)}</span>
                  </p>
                </div>

                {m.remarks && <p className="mt-3 text-sm text-ink-2 italic">{m.remarks}</p>}

                {/* AC Land Officer Action Bar */}
                {isOfficer && m.status !== 'APPROVED' && m.status !== 'REJECTED' && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-hair pt-3">
                    <span className="mono text-2xs font-semibold uppercase text-indigo">
                      AC (Land) Judicial Actions:
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenOrder(m, 'REJECT')}
                      >
                        <XCircle className="h-3.5 w-3.5 text-seal" /> Reject Case
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleOpenOrder(m, 'ADVANCE')}
                      >
                        {m.status === 'DCR_PAYMENT_PENDING' ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                        {m.status === 'SUBMITTED'
                          ? 'Assign Kanungo Survey'
                          : m.status === 'KANUNGO_VERIFICATION'
                          ? 'Schedule Hearing'
                          : m.status === 'AC_LAND_HEARING'
                          ? 'Pass Order & Issue DCR'
                          : 'Approve & Issue Khatian'}
                      </Button>
                    </div>
                  </div>
                )}
              </Panel>
            ))}
          </Stagger>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} label={parcel.id} title="File a নামজারি" bn="নামজারির আবেদন" wide>
        <MutationWizard parcel={parcel} onDone={handleWizardDone} onCancel={() => setOpen(false)} />
      </Modal>

      <Modal open={!!filed} onClose={() => setFiled(null)} label="Filed" title="Application Received">
        {filed && (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">Keep this tracking case number to check the state at any stage.</p>
            <p className="mono border border-line bg-ground-sunk px-4 py-3 text-lg font-bold text-ink">{filed.caseNumber}</p>
            <p className="text-sm text-ink-2">
              Next: The Union Land Office assigns the file for field survey. You will receive an SMS when a hearing date is
              scheduled.
            </p>
            <Button variant="primary" className="w-full" onClick={() => setFiled(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>

      {/* AC Land Judicial Ruling Modal */}
      {selectedMutation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div
            ref={judicialModalRef}
            role="dialog"
            aria-modal="true"
            aria-label="AC (Land) judicial ruling"
            className="relative w-full max-w-lg border border-line bg-sheet p-6 shadow-xl animate-sheet-in"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="sheet-title text-base font-semibold text-ink">
                  সহকারী কমিশনার (ভূমি) এর বিচারিক আদেশ
                </h3>
                <p className="mono text-2xs text-indigo">
                  মামলা নং: {selectedMutation.caseNumber} &middot; {parcel.upazila}, মৌজা: {parcel.mouza}
                </p>
              </div>
              <button
                onClick={() => setSelectedMutation(null)}
                aria-label="Close"
                className="text-ink-3 hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteOrder} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink mb-1.5">
                  বিচারিক সিদ্ধান্ত (Judicial Ruling):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderAction('ADVANCE')}
                    className={`p-2.5 text-center border rounded transition-colors ${
                      orderAction === 'ADVANCE'
                        ? 'border-indigo bg-indigo-soft text-indigo font-bold'
                        : 'border-line text-ink-2'
                    }`}
                  >
                    ✓ পর্যায় অনুমোদন ও অগ্রসর
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderAction('REJECT')}
                    className={`p-2.5 text-center border rounded transition-colors ${
                      orderAction === 'REJECT'
                        ? 'border-seal bg-seal-soft text-seal font-bold'
                        : 'border-line text-ink-2'
                    }`}
                  >
                    ✕ আবেদন খারিজ / বাতিল
                  </button>
                </div>
              </div>

              {orderAction === 'ADVANCE' && selectedMutation.status === 'KANUNGO_VERIFICATION' && (
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    শুনানীর তারিখ নির্ধারণ (Hearing Date):
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
                  সরকারি আদেশনামা নোট (Order Sheet Note):
                </label>
                <textarea
                  rows={3}
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className={`${inputClass} w-full font-sans`}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button size="sm" type="button" onClick={() => setSelectedMutation(null)}>
                  বাতিল (Cancel)
                </Button>
                <Button size="sm" variant={orderAction === 'ADVANCE' ? 'primary' : 'secondary'} type="submit" disabled={submittingOrder}>
                  {submittingOrder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {orderAction === 'ADVANCE' ? 'আদেশ মঞ্জুর করুন' : 'খারিজ আদেশ কার্যকর করুন'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
