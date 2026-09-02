import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, CheckCircle2, Loader2, KeyRound, Smartphone } from 'lucide-react';
import Modal from './Modal';
import { Button, inputClass } from './ui';
import { toggleParcelLock, sendSimulatedSms } from '../lib/api';
import type { Parcel } from '../lib/types';
import { useLanguage } from '../lib/language';

interface Props {
  open: boolean;
  onClose: () => void;
  parcel: Parcel;
  onSuccess: () => void;
}

export default function LandLockModal({ open, onClose, parcel, onSuccess }: Props) {
  const { pickLang, t } = useLanguage();
  const [step, setStep] = useState<'info' | 'otp'>('info');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentlyLocked = !!parcel.isLocked;

  const handleRequestOtp = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      // Send simulated OTP SMS
      sendSimulatedSms({
        recipientPhone: parcel.phone,
        senderId: 'BHUMISHEBA',
        messageText: `ভূমি সেবা নিরাপত্তা কোড: 123456। আপনার খতিয়ান ${parcel.khatianNo} এর ভূমি লক ${isCurrentlyLocked ? 'নিষ্ক্রিয়' : 'সক্রিয়'} করার জন্য এই কোডটি ব্যবহার করুন।`,
        type: 'LAND_LOCK',
      });
    }, 600);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim() !== '123456' && otp.trim().length !== 6) {
      setError('সঠিক ৬-সংখ্যার ওটিপি কোডটি লিখুন (ডেমো কোড: 123456)');
      return;
    }

    setLoading(true);
    try {
      await toggleParcelLock(parcel.id, otp);
      setLoading(false);
      onSuccess();
      onClose();
      setStep('info');
      setOtp('');
    } catch {
      setError('ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={t('Citizen Security Guard', 'নাগরিক ভূমি নিরাপত্তা')}
      title={isCurrentlyLocked ? t('Deactivate Land Lock', 'ভূমি লক নিষ্ক্রিয়করণ') : t('Activate Digital Land Lock', 'স্মার্ট ভূমি লক সক্রিয়করণ')}
    >
      {step === 'info' ? (
        <div className="space-y-4">
          <div className={`border p-4 ${isCurrentlyLocked ? 'border-amber/30 bg-amber-soft' : 'border-state/30 bg-state-soft'}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isCurrentlyLocked ? 'bg-amber text-white' : 'bg-state text-white'}`}>
                {isCurrentlyLocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-ink">
                  {isCurrentlyLocked 
                    ? t('Current Status: RECORD LOCKED', 'বর্তমান অবস্থা: ভূমি রেকর্ড লক করা') 
                    : t('Current Status: UNLOCKED', 'বর্তমান অবস্থা: সাধারণ / আনলক')}
                </h4>
                <p className="text-xs text-ink-2">
                  খতিয়ান: <strong className="mono">{parcel.khatianNo}</strong> &middot; দাগ: <strong className="mono">{parcel.dagNo}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-ink-2 space-y-2">
            <p>
              <strong>স্মার্ট ভূমি লক কী?</strong>
            </p>
            <p>
              প্রবাসী বাংলাদেশি, বয়োজ্যেষ্ঠ নাগরিক অথবা জমি বিক্রয় বা হস্তান্তরে অনিচ্ছুক মালিকদের জন্য ভূমি মন্ত্রণালয়ের একটি স্বয়ংক্রিয় প্রতিরক্ষা ব্যবস্থা।
            </p>
            <ul className="list-disc pl-5 space-y-1 text-ink-3">
              <li>লক সক্রিয় থাকা অবস্থায় সাব-রেজিস্ট্রি অফিসে কোনো দলিলের মাধ্যমে এই খতিয়ানের জমি রেজিস্ট্রি করা যাবে না।</li>
              <li>এসিল্যান্ড অফিসে যেকোনো নতুন নামজারি আবেদন তাৎক্ষণিকভাবে স্থগিত হবে।</li>
              <li>কেউ এই রেকর্ডে কোনো পরিবর্তন করতে গেলে আপনার মোবাইলে ({parcel.phone}) তাৎক্ষণিক সতর্কবার্তা যাবে।</li>
            </ul>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button size="sm" onClick={onClose}>
              বাতিল (Cancel)
            </Button>
            <Button
              size="sm"
              variant={isCurrentlyLocked ? 'secondary' : 'primary'}
              onClick={handleRequestOtp}
              disabled={loading}
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isCurrentlyLocked ? 'লক নিষ্ক্রিয় করতে ওটিপি পাঠান' : 'লক সক্রিয় করতে ওটিপি পাঠান'}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="flex items-center gap-2 rounded border border-indigo/20 bg-indigo-soft p-3 text-xs text-indigo">
            <Smartphone className="h-5 w-5 shrink-0 text-indigo" />
            <div>
              <p className="font-semibold">নিরাপত্তা ওটিপি প্রেরণ করা হয়েছে</p>
              <p className="text-2xs">আপনার নিবন্ধিত নম্বর <strong className="mono">{parcel.phone}</strong> এ একটি ৬-সংখ্যার কোড পাঠানো হয়েছে। (পরীক্ষামূলক ওটিপি: 123456)</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              ৬-সংখ্যার ওটিপি কোড (Enter 6-digit OTP):
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className={`${inputClass} mono pl-9 text-center text-lg tracking-widest font-bold`}
                autoFocus
              />
            </div>
            {error && <p className="mt-1 text-xs text-seal font-medium">{error}</p>}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button size="sm" type="button" onClick={() => setStep('info')}>
              পেছনে (Back)
            </Button>
            <Button size="sm" variant="primary" type="submit" disabled={loading || otp.length === 0}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {isCurrentlyLocked ? 'লক মুক্ত করুন (Unlock Record)' : 'নিরাপত্তা লক চূড়ান্ত করুন (Lock Record)'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
