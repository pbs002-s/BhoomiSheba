import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { Button, Field, inputClass } from './ui';
import { submitComplaint } from '../lib/api';
import type { Complaint } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  parcelId: string;
  defaultOwner?: string;
  defaultPhone?: string;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Plot Boundary Demarcation (সীমানা নির্ধারণ)',
  'Fake Deed / Forgery Allegation (জাল দলিল সংক্রান্ত)',
  'Illegal Encroachment (অবৈধ দখল সংক্রান্ত)',
  'Tax Assessment Dispute (ভূমি উন্নয়ন কর বিরোধ)',
  'Khatian / RS Record Correction (খতিয়ান সংশোধন আবেদন)',
  'Inheritance Share Dispute (উত্তরাধিকার বণ্টন বিরোধ)',
];

export default function DisputeModal({
  open,
  onClose,
  parcelId,
  defaultOwner = '',
  defaultPhone = '',
  onSuccess,
}: Props) {
  const [complainant, setComplainant] = useState(defaultOwner);
  const [phone, setPhone] = useState(defaultPhone);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [filed, setFiled] = useState<Complaint | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await submitComplaint({
      parcelId,
      complainant,
      phone,
      category,
      description,
    });
    setBusy(false);
    setFiled(res.complaint);
    if (onSuccess) onSuccess();
  };

  const handleReset = () => {
    setFiled(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={parcelId}
      title="Lodge Citizen Dispute"
      bn="অভিযোগ ও বিরোধ নিষ্পত্তি আবেদন"
    >
      {filed ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 border border-state/30 bg-state-soft p-4 text-state">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Complaint Registered Successfully</p>
              <p className="text-xs">আপনার অভিযোগটি রেকর্ডভুক্ত করা হয়েছে।</p>
            </div>
          </div>

          <div className="border border-line bg-sheet-raised p-4">
            <p className="mono text-2xs uppercase text-ink-3">Official Tracking Token</p>
            <p className="mono text-lg font-bold text-ink">{filed.trackingNo}</p>
            <p className="mt-2 text-xs text-ink-2">
              Assigned to: <span className="font-medium text-ink">{filed.assignedOffice}</span>
            </p>
            <p className="mt-1 text-xs text-ink-3">
              Keep this token. You will receive an SMS status update on <span className="mono">{filed.phone}</span>.
            </p>
          </div>

          <Button variant="primary" className="w-full" onClick={handleReset}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-2.5 border border-line bg-ground-sunk p-3 text-xs text-ink-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo" />
            <span>
              Direct integration with Ministry of Land 16122 hotline & AC (Land) Revenue Court.
            </span>
          </div>

          <Field label="Complainant Name (আবেদনকারীর নাম)" htmlFor="dcomp">
            <input
              id="dcomp"
              required
              value={complainant}
              onChange={(e) => setComplainant(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Mobile Number (মোবাইল নম্বর)" htmlFor="dphone" hint="Status SMS will be dispatched here.">
            <input
              id="dphone"
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClass} mono tnum`}
            />
          </Field>

          <Field label="Dispute Category (অভিযোগের ধরন)" htmlFor="dcat">
            <select
              id="dcat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description & Statement (বিস্তারিত বিবরণ)" htmlFor="ddesc">
            <textarea
              id="ddesc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue, specific boundary points, or deed discrepancy..."
              className={inputClass}
            />
          </Field>

          <div className="flex gap-2 pt-2">
            <Button type="button" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" className="flex-1" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? 'Submitting' : 'Submit Dispute'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
