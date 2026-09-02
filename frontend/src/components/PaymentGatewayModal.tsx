import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { payTax } from '../lib/api';
import type { Parcel, TaxRecord } from '../lib/types';
import { taka } from '../lib/format';

interface PaymentGatewayModalProps {
  open: boolean;
  onClose: () => void;
  parcel: Parcel;
  taxRecord: TaxRecord;
  onPaymentSuccess: (paidRecord: TaxRecord) => void;
}

type GatewayMethod = 'bKash' | 'Nagad' | 'Rocket' | 'Card';

const GATEWAYS: Array<{
  id: GatewayMethod;
  name: string;
  bn: string;
  color: string;
  bgLight: string;
  textColor: string;
  logoText: string;
  feeText: string;
}> = [
  {
    id: 'bKash',
    name: 'bKash Digital',
    bn: 'বিকাশ পেমেন্ট',
    color: '#D12053',
    bgLight: '#FDEBF1',
    textColor: '#D12053',
    logoText: 'bKash',
    feeText: 'Government Subsidized (0% convenience fee)',
  },
  {
    id: 'Nagad',
    name: 'Nagad Post Office',
    bn: 'নগদ ডিজিটাল পেমেন্ট',
    color: '#F37023',
    bgLight: '#FEF1EA',
    textColor: '#F37023',
    logoText: 'নগদ',
    feeText: 'Instant LD Tax Settlement',
  },
  {
    id: 'Rocket',
    name: 'DBBL Rocket',
    bn: 'রকেট মোবাইল ব্যাংকিং',
    color: '#8C3494',
    bgLight: '#F6EBF8',
    textColor: '#8C3494',
    logoText: 'Rocket',
    feeText: 'Official Dutch-Bangla Ingress',
  },
  {
    id: 'Card',
    name: 'Debit / Credit Card & Ekpay',
    bn: 'কার্ড / একপে গেটওয়ে',
    color: '#1A3F68',
    bgLight: '#E8EEF5',
    textColor: '#1A3F68',
    logoText: 'VISA / MC',
    feeText: 'Ekpay Bangladesh Central Gateway',
  },
];

export default function PaymentGatewayModal({
  open,
  onClose,
  parcel,
  taxRecord,
  onPaymentSuccess,
}: PaymentGatewayModalProps) {
  const [method, setMethod] = useState<GatewayMethod>('bKash');
  const [step, setStep] = useState<'details' | 'otp' | 'pin' | 'processing' | 'success'>('details');

  // Input states
  const [walletNumber, setWalletNumber] = useState(parcel.phone.replace(/\D/g, '').slice(-11) || '01711223344');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  // OTP & PIN simulation states
  const [generatedOtp, setGeneratedOtp] = useState('739201');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [pin, setPin] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [completedRecord, setCompletedRecord] = useState<TaxRecord | null>(null);

  // Reset states when opening modal
  useEffect(() => {
    if (open) {
      setStep('details');
      setError(null);
      setEnteredOtp('');
      setPin('');
      setCountdown(60);
      setGeneratedOtp(String(Math.floor(100000 + Math.random() * 900000)));
    }
  }, [open]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [step, countdown]);

  if (!open) return null;

  const currentGateway = GATEWAYS.find((g) => g.id === method) || GATEWAYS[0];

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (method !== 'Card') {
      const cleanPhone = walletNumber.replace(/\D/g, '');
      if (cleanPhone.length < 11) {
        setError('Please provide a valid 11-digit Bangladesh mobile number.');
        return;
      }
    } else {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid 16-digit card number.');
        return;
      }
    }

    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(newOtp);
    setCountdown(60);
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (enteredOtp.trim() !== generatedOtp && enteredOtp.trim() !== '123456') {
      setError(`Invalid OTP. For test simulation, use ${generatedOtp} or 123456.`);
      return;
    }
    setStep('pin');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length < 4) {
      setError('Please enter your 4 or 5 digit security PIN.');
      return;
    }

    setStep('processing');

    try {
      const result = await payTax({
        parcelId: parcel.id,
        fiscalYear: taxRecord.fiscalYear,
        amount: taxRecord.totalDueBDT,
        paymentMethod: `${currentGateway.name} (${currentGateway.id})`,
      });

      setCompletedRecord(result.taxRecord);
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess(result.taxRecord);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Payment failed. Please retry.');
      setStep('pin');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative my-auto w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden rounded-lg border border-line bg-sheet shadow-2xl">
        {/* Gateway Branded Header */}
        <div
          className="flex shrink-0 items-center justify-between px-6 py-4 text-white"
          style={{ backgroundColor: currentGateway.color }}
        >
          <div className="flex items-center gap-3">
            <span className="rounded bg-white/20 px-2.5 py-1 font-mono text-sm font-bold tracking-wider">
              {currentGateway.logoText}
            </span>
            <div>
              <h3 className="text-base font-bold leading-tight">{currentGateway.name}</h3>
              <p className="text-xs text-white/80">{currentGateway.bn}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Parcel & Payment Summary Banner */}
        <div className="border-b border-line bg-ground-sunk px-6 py-3">
          <div className="flex items-center justify-between text-xs text-ink-3">
            <span>Land Development Tax &middot; {taxRecord.fiscalYear}</span>
            <span className="mono font-semibold text-ink">Parcel: {parcel.id}</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-sm font-medium text-ink">Total Payable Amount:</span>
            <span className="mono text-2xl font-bold text-ink">{taka(taxRecord.totalDueBDT)}</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded border border-seal/30 bg-seal-soft px-3 py-2 text-xs text-seal">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Details & Method Selection */}
        {step === 'details' && (
          <form onSubmit={handleProceedToOtp} className="space-y-4 overflow-y-auto p-6">
            <div>
              <label className="mono mb-2 block text-2xs uppercase text-ink-3">Select Payment Gateway</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {GATEWAYS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setMethod(g.id);
                      setError(null);
                    }}
                    className={`flex flex-col items-center justify-center rounded border p-2.5 text-xs transition-all ${
                      method === g.id
                        ? 'border-indigo bg-indigo-soft font-bold text-indigo shadow-sm'
                        : 'border-line bg-sheet-raised text-ink-2 hover:border-line-strong'
                    }`}
                  >
                    <span className="font-semibold">{g.name.split(' ')[0]}</span>
                    <span className="mt-0.5 text-2xs text-ink-3">{g.id === 'Card' ? 'Ekpay' : 'Wallet'}</span>
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-2xs text-ink-3">{currentGateway.feeText}</p>
            </div>

            {method !== 'Card' ? (
              <div>
                <label className="mb-1 block text-xs font-medium text-ink" htmlFor="wallet-number">
                  {currentGateway.name} Account Number (মোবাইল নম্বর)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-ink-3">+88</span>
                  <input
                    id="wallet-number"
                    type="tel"
                    required
                    value={walletNumber}
                    onChange={(e) => setWalletNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full rounded border border-line bg-sheet-raised py-2 pl-12 pr-3 font-mono text-sm text-ink outline-none focus:border-indigo"
                  />
                </div>
                <p className="mt-1 text-2xs text-ink-3">
                  Verification OTP will be simulated and sent to this mobile number.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink" htmlFor="card-number">
                    Card Number (কার্ড নম্বর)
                  </label>
                  <input
                    id="card-number"
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full rounded border border-line bg-sheet-raised px-3 py-2 font-mono text-sm text-ink outline-none focus:border-indigo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink" htmlFor="card-exp">
                      Expiry (MM/YY)
                    </label>
                    <input
                      id="card-exp"
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full rounded border border-line bg-sheet-raised px-3 py-2 font-mono text-sm text-ink outline-none focus:border-indigo"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-ink" htmlFor="card-cvv">
                      CVV / CVC
                    </label>
                    <input
                      id="card-cvv"
                      type="password"
                      maxLength={4}
                      required
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full rounded border border-line bg-sheet-raised px-3 py-2 font-mono text-sm text-ink outline-none focus:border-indigo"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded bg-ground-sunk p-3 text-2xs text-ink-3">
              <Lock className="h-4 w-4 shrink-0 text-state" />
              <span>
                256-bit SSL encrypted government digital payment protocol. Safe, certified, and reconciled.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded border border-line py-2.5 text-xs font-semibold text-ink hover:bg-ground-sunk"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-1.5 rounded py-2.5 text-xs font-semibold text-white shadow transition-all"
                style={{ backgroundColor: currentGateway.color }}
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: One-Time Password (OTP) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 p-6">
            <div className="rounded border border-indigo/20 bg-indigo-soft p-3 text-xs text-indigo">
              <p className="font-semibold">SMS OTP Verification Code Dispatched:</p>
              <p className="mt-1 font-mono text-lg font-bold tracking-widest text-ink">{generatedOtp}</p>
              <p className="mt-1 text-2xs text-ink-3">
                Simulated for demonstration. Auto-filled or type the 6-digit code above.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink" htmlFor="otp-input">
                Enter 6-Digit OTP (কোড লিখুন)
              </label>
              <div className="flex gap-2">
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder={generatedOtp}
                  className="w-full rounded border border-line bg-sheet-raised px-3 py-2 text-center font-mono text-lg font-bold tracking-widest text-ink outline-none focus:border-indigo"
                />
                <button
                  type="button"
                  onClick={() => setEnteredOtp(generatedOtp)}
                  className="shrink-0 rounded border border-line bg-sheet-raised px-3 text-xs font-medium text-indigo hover:bg-ground-sunk"
                >
                  Auto-Fill
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-2xs text-ink-3">
                <span>Code expires in: {countdown}s</span>
                <button
                  type="button"
                  onClick={() => {
                    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
                    setGeneratedOtp(newOtp);
                    setCountdown(60);
                  }}
                  className="text-indigo hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="flex-1 rounded border border-line py-2.5 text-xs font-semibold text-ink hover:bg-ground-sunk"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded py-2.5 text-xs font-semibold text-white shadow transition-all"
                style={{ backgroundColor: currentGateway.color }}
              >
                Verify OTP
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PIN Confirmation */}
        {step === 'pin' && (
          <form onSubmit={handleConfirmPayment} className="space-y-4 p-6">
            <div className="rounded border border-line bg-sheet-raised p-4 text-center">
              <Lock className="mx-auto h-8 w-8 text-indigo" />
              <h4 className="mt-2 text-sm font-semibold text-ink">Enter Account Security PIN</h4>
              <p className="mt-1 text-xs text-ink-3">
                Enter your {currentGateway.name} PIN to authorize deduction of {taka(taxRecord.totalDueBDT)}.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-ink" htmlFor="pin-input">
                {currentGateway.name} PIN (গোপন পিন)
              </label>
              <input
                id="pin-input"
                type="password"
                maxLength={5}
                autoFocus
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="•••••"
                className="w-full rounded border border-line bg-sheet-raised px-3 py-2 text-center font-mono text-xl tracking-widest text-ink outline-none focus:border-indigo"
              />
              <p className="mt-1 text-center text-2xs text-ink-3">Demo mode: Enter any 4 or 5 digit PIN (e.g. 12345)</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('otp')}
                className="flex-1 rounded border border-line py-2.5 text-xs font-semibold text-ink hover:bg-ground-sunk"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 rounded py-2.5 text-xs font-semibold text-white shadow transition-all"
                style={{ backgroundColor: currentGateway.color }}
              >
                Confirm Payment {taka(taxRecord.totalDueBDT)}
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Processing State */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center space-y-3 p-10 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo" />
            <h4 className="text-base font-semibold text-ink">Reconciling Transaction with Bangladesh Treasury...</h4>
            <p className="max-w-xs text-xs text-ink-3">
              Communicating with {currentGateway.name}, verifying fund transfer, and registering cryptographic Dakhila in the National Land Database.
            </p>
          </div>
        )}

        {/* STEP 5: Success State */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-state-soft text-state">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-ink">পেমেন্ট সফল হয়েছে! (Payment Verified)</h4>
            <p className="text-xs text-ink-3">
              LD Tax cleared for {taxRecord.fiscalYear}. Digital Dakhila receipt issued.
            </p>
            {completedRecord && (
              <div className="w-full rounded border border-line bg-sheet-raised p-3 text-left text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-ink-3">Dakhila No:</span>
                  <span className="mono font-semibold text-ink">{completedRecord.dakhilaNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-3">Transaction ID:</span>
                  <span className="mono font-semibold text-ink">{completedRecord.trxId}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-ink-3">Settlement:</span>
                  <span className="text-state font-semibold">Immediate &amp; Reconciled</span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (completedRecord) onPaymentSuccess(completedRecord);
                onClose();
              }}
              className="mt-2 w-full rounded bg-indigo py-2.5 text-xs font-semibold text-white hover:bg-indigo/90"
            >
              View Official Dakhila (দাখিলা দেখুন)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
