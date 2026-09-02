import React, { useState, useEffect } from 'react';
import { Smartphone, BellRing, Send, CheckCircle2, ShieldCheck, RefreshCw, MessageSquare } from 'lucide-react';
import Modal from './Modal';
import { Button, StatusMark } from './ui';
import { listSmsAlerts, sendSimulatedSms } from '../lib/api';
import type { SmsAlert, Parcel } from '../lib/types';
import { shortDate } from '../lib/format';
import { useLanguage } from '../lib/language';

interface Props {
  open: boolean;
  onClose: () => void;
  parcel: Parcel;
}

export default function AlertRadarModal({ open, onClose, parcel }: Props) {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<SmsAlert[]>([]);
  const [sending, setSending] = useState(false);

  const loadAlerts = async () => {
    const list = await listSmsAlerts();
    setAlerts(list);
  };

  useEffect(() => {
    if (open) loadAlerts();
  }, [open]);

  const handleSendTestSms = async () => {
    setSending(true);
    await sendSimulatedSms({
      recipientPhone: parcel.phone,
      senderId: 'BHUMISHEBA',
      messageText: `ভূমি সেবা টেস্ট রাডার: খতিয়ান ${parcel.khatianNo} এ রিয়েলটাইম সিকিউরিটি রাডার সফলভাবে সক্রিয় রয়েছে। সময়: ${new Date().toLocaleTimeString('en-GB')}`,
      type: 'MUTATION_ACTIVITY',
    });
    await loadAlerts();
    setSending(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={t('Citizen Protection Radar', 'নাগরিক সুরক্ষা রাডার')}
      title={t('Live Property Alert & SMS Dispatch', 'রিয়েলটাইম নোটিশ ও এসএমএস রাডার')}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-indigo" />
            <div>
              <span className="mono text-xs font-semibold text-ink">{parcel.phone}</span>
              <p className="text-2xs text-ink-3">নিবন্ধিত মোবাইল নম্বর (Registered Citizen Phone)</p>
            </div>
          </div>
          <Button size="sm" onClick={handleSendTestSms} disabled={sending}>
            <Send className="h-3.5 w-3.5" />
            {sending ? 'প্রেরণ হচ্ছে...' : 'টেস্ট এসএমএস পাঠান (Send Test SMS)'}
          </Button>
        </div>

        <p className="text-xs text-ink-2">
          আপনার ভূমির খতিয়ানে নামজারি আবেদন, কর পরিশোধ, সীমানা বিরোধ বা কোনো নোটিশ উত্থাপিত হলে তাৎক্ষণিকভাবে জাতীয় গেটওয়ে হতে প্রেরিত ক্ষুদেবার্তাসমূহ:
        </p>

        <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-xs text-ink-3">কোনো ক্ষুদেবার্তা এখনো প্রেরিত হয়নি।</p>
          ) : (
            alerts.map((al) => (
              <div
                key={al.id}
                className="rounded border border-line bg-sheet-raised p-3 transition-colors hover:bg-ground-sunk"
              >
                <div className="flex items-center justify-between text-2xs">
                  <span className="mono font-bold text-indigo">{al.senderId}</span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-ink-3">{shortDate(al.timestamp)} &middot; {new Date(al.timestamp).toLocaleTimeString('en-GB')}</span>
                    <StatusMark tone="state">DELIVERED</StatusMark>
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-ink-2 font-sans leading-relaxed">
                  {al.messageText}
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-line-hair pt-1 text-[10px] text-ink-3">
                  <span>প্রাপক: {al.recipientPhone}</span>
                  <span>Teletalk / Grameenphone Gateway</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={onClose}>
            বন্ধ করুন (Close)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
