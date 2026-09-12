import React, { useRef, useState } from 'react';
import { Check, FileUp, Loader2, Trash2 } from 'lucide-react';
import { Button, Field, inputClass } from './ui';
import { cx, taka } from '../lib/format';
import { fileMutation } from '../lib/api';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';
import type { Mutation, Parcel } from '../lib/types';

const DCR_FEE_BDT = 1150;

const STEPS = [
  { en: 'Applicant', bn: 'আবেদনকারী' },
  { en: 'Record', bn: 'খতিয়ান' },
  { en: 'Documents', bn: 'কাগজপত্র' },
  { en: 'Fee', bn: 'ফি' },
  { en: 'Submit', bn: 'জমা' },
] as const;

interface FormState {
  applicantName: string;
  applicantNid: string;
  applicantPhone: string;
  proposedOwner: string;
}

const EMPTY_FORM: FormState = { applicantName: '', applicantNid: '', applicantPhone: '', proposedOwner: '' };

function StepDots({ step }: { step: number }) {
  return (
    <ol className="mb-5 grid grid-cols-5 gap-px border border-line bg-line text-center">
      {STEPS.map((s, i) => (
        <li
          key={s.en}
          className={cx(
            'bg-sheet px-1.5 py-2',
            i === step && 'bg-indigo-soft',
            i < step && 'bg-state-soft'
          )}
        >
          <span
            className={cx(
              'mono block text-2xs',
              i < step ? 'text-state' : i === step ? 'text-indigo' : 'text-ink-3'
            )}
          >
            {i < step ? <Check className="mx-auto h-3 w-3" /> : String(i + 1).padStart(2, '0')}
          </span>
          <span className={cx('mt-0.5 block text-[10px] font-medium', i <= step ? 'text-ink' : 'text-ink-3')}>
            {s.en}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function MutationWizard({
  parcel,
  onDone,
  onCancel,
}: {
  parcel: Parcel;
  onDone: (mutation: Mutation) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stepRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const el = stepRef.current;
      if (!el || prefersReducedMotion()) return;
      gsap.fromTo(el, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
    },
    { dependencies: [step], scope: stepRef }
  );

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const canAdvance = (): boolean => {
    if (step === 0) return form.applicantName.trim().length > 1 && form.applicantNid.replace(/\D/g, '').length >= 10 && form.applicantPhone.replace(/\D/g, '').length >= 10;
    if (step === 1) return form.proposedOwner.trim().length > 1;
    return true;
  };

  const next = () => {
    if (!canAdvance()) {
      setError('Please fill in every field on this step before continuing.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list).map((file) => file.name)]);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { mutation } = await fileMutation({ parcelId: parcel.id, ...form });
      onDone(mutation);
    } catch (err: any) {
      setError(err?.message || 'Could not file the application. Please retry.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <StepDots step={step} />

      {error && (
        <p className="mb-4 border-l-2 border-seal bg-seal-soft px-3 py-2 text-xs text-seal">{error}</p>
      )}

      <div ref={stepRef}>
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Applicant name (আবেদনকারীর নাম)" htmlFor="w-an">
              <input id="w-an" required value={form.applicantName} onChange={set('applicantName')} className={inputClass} />
            </Field>
            <Field label="Applicant NID (জাতীয় পরিচয়পত্র)" htmlFor="w-anid">
              <input
                id="w-anid"
                required
                inputMode="numeric"
                value={form.applicantNid}
                onChange={set('applicantNid')}
                className={`${inputClass} mono tnum`}
              />
            </Field>
            <Field label="Mobile number (মোবাইল নম্বর)" htmlFor="w-aph" hint="Hearing notices are sent to this number.">
              <input
                id="w-aph"
                required
                inputMode="tel"
                value={form.applicantPhone}
                onChange={set('applicantPhone')}
                className={`${inputClass} mono tnum`}
              />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-px border border-line bg-line text-xs">
              {[
                ['Mouza', parcel.mouza],
                ['Khatian No', parcel.khatianNo],
                ['Dag No', parcel.dagNo],
                ['Holding No', parcel.holdingNo],
              ].map(([k, v]) => (
                <div key={k} className="bg-sheet px-3 py-2.5">
                  <span className="mono block text-2xs uppercase text-ink-3">{k}</span>
                  <span className="mt-0.5 block text-ink">{v}</span>
                </div>
              ))}
            </div>
            <Field label="Proposed owner (কার নামে নামজারি হবে)" htmlFor="w-po" hint="This is who the record transfers to.">
              <input id="w-po" required value={form.proposedOwner} onChange={set('proposedOwner')} className={inputClass} />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-ink-2">
              Attach the deed, latest chain-of-title khatian copy, and NID. This demo accepts any file to show the
              flow — nothing is uploaded off your device.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-line-strong bg-ground-sunk py-6 text-sm text-ink-2 hover:border-indigo hover:text-indigo"
            >
              <FileUp className="h-4 w-4" /> Choose files to attach
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            {files.length > 0 && (
              <ul className="divide-y divide-line-hair border border-line">
                {files.map((name, i) => (
                  <li key={`${name}-${i}`} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                    <span className="truncate text-ink">{name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                      aria-label={`Remove ${name}`}
                      className="text-ink-3 hover:text-seal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="border border-line">
              <div className="flex items-center justify-between border-b border-line-hair px-4 py-2.5 text-sm">
                <span className="text-ink-2">Duplicate Carbon Receipt (DCR) fee</span>
                <span className="mono font-semibold text-ink">{taka(DCR_FEE_BDT)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-semibold text-ink">Payable after hearing</span>
                <span className="mono text-lg font-bold text-indigo">{taka(DCR_FEE_BDT)}</span>
              </div>
            </div>
            <p className="text-xs text-ink-3">
              No payment is collected now. The DCR fee becomes payable once the AC (Land) hearing clears the
              application, from the Land Tax panel.
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <p className="text-ink-2">Review before you file:</p>
            <div className="divide-y divide-line-hair border border-line text-xs">
              {[
                ['Applicant', form.applicantName],
                ['NID', form.applicantNid],
                ['Mobile', form.applicantPhone],
                ['Proposed owner', form.proposedOwner],
                ['Attachments', files.length ? `${files.length} file(s)` : 'None attached'],
                ['DCR fee', taka(DCR_FEE_BDT)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between px-3 py-2">
                  <span className="text-ink-3">{k}</span>
                  <span className="font-medium text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        {step > 0 && (
          <Button type="button" className="flex-1" onClick={back} disabled={busy}>
            Back
          </Button>
        )}
        <Button type="button" className="flex-1" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="primary" type="button" className="flex-1" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button variant="primary" type="button" className="flex-1" onClick={submit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? 'Filing' : 'File Application'}
          </Button>
        )}
      </div>
    </div>
  );
}
