import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Landmark, Loader2 } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { demoAccounts } from '../lib/demoData';
import { writeSession } from '../lib/api';
import { Lines } from '../components/motion';
import ParcelPlate from '../components/ParcelPlate';
import { Button, Eyebrow, Field, ThemeToggle, LanguageToggle, inputClass } from '../components/ui';
import { useLanguage } from '../lib/language';
import { cx } from '../lib/format';
import type { Role } from '../lib/types';
import type { Theme } from '../lib/theme';

/**
 * Sign-in is two steps because the real service is: identity, then a code
 * sent to the phone on the record. The demo keeps the shape and drops the
 * secrecy — the code is printed on screen.
 */
export default function SignIn({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { navigate } = useRouter();
  const { lang, toggleLang, t } = useLanguage();
  const [role, setRole] = useState<Role>('citizen');
  const [step, setStep] = useState<'identity' | 'code'>('identity');
  const [nid, setNid] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement | null>(null);

  const account = demoAccounts.find((a) => a.role === role)!;

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const fillDemo = () => {
    setNid(account.nid);
    setPhone(account.phone);
    setError(null);
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (nid.replace(/\D/g, '').length < 10) {
      setError('Enter the 17-digit NID number on your card. Use the demo account below if you just want to look around.');
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 450));
    setBusy(false);
    setStep('code');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (code.replace(/\D/g, '') !== account.otp) {
      setError(`That code does not match. The demo code is ${account.otp}.`);
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    writeSession({
      name: account.name,
      nid: account.nid,
      role,
      office: 'office' in account ? account.office : undefined,
      parcels: account.parcels,
      signedInAt: new Date().toISOString(),
    });
    navigate('/app');
  };

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-shell items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center border border-ink text-ink">
              <Landmark className="h-3.5 w-3.5" />
            </span>
            <span className="bn text-[15px] font-semibold text-ink">ভূমি সেবা</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} onToggle={toggleLang} />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Link to="/" className="text-sm text-ink-2 transition-colors duration-1 hover:text-ink">
              {t('Back', 'ফিরে যান')}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-shell gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-20">
        {/* context side — keeps the plate present, so signing in feels like
            opening a specific record rather than entering a generic app */}
        <div className="order-2 hidden lg:order-1 lg:block">
          <Eyebrow>Signing in opens</Eyebrow>
          <Lines
            className="sheet-title mt-3 text-3xl font-semibold text-ink"
            lines={['Your parcel record,', 'as the offices see it.']}
            stagger={80}
          />
          <p className="mt-4 max-w-measure text-ink-2">
            The same খতিয়ান, tax account, নামজারি cases and boundary that the union land office works from —
            with the parts that disagree marked rather than hidden.
          </p>
          <div className="reg-mark relative mt-8 border border-line bg-sheet p-6">
            <ParcelPlate compact />
          </div>
        </div>

        {/* form side */}
        <div className="order-1 lg:order-2">
          <div className="reg-mark relative mx-auto max-w-md border border-line bg-sheet p-6 sm:p-8">
            <Eyebrow>{step === 'identity' ? 'Step 1 of 2' : 'Step 2 of 2'}</Eyebrow>
            <h1 className="sheet-title mt-2 text-2xl font-semibold text-ink">
              {step === 'identity' ? 'Sign in' : 'Enter the code'}
            </h1>
            <p className="bn mt-1 text-sm text-ink-3">
              {step === 'identity' ? 'প্রবেশ করুন' : 'কোডটি লিখুন'}
            </p>

            {step === 'identity' ? (
              <form onSubmit={sendCode} className="mt-7 space-y-5">
                <div>
                  <span className="mono mb-2 block text-2xs uppercase text-ink-3">Sign in as</span>
                  <div className="grid grid-cols-2 gap-px border border-line bg-line">
                    {demoAccounts.map((a) => (
                      <button
                        key={a.role}
                        type="button"
                        onClick={() => {
                          setRole(a.role);
                          setNid('');
                          setPhone('');
                          setError(null);
                        }}
                        className={cx(
                          'px-3 py-2.5 text-left transition-colors duration-1',
                          role === a.role ? 'bg-indigo-soft' : 'bg-sheet-raised hover:bg-ground-sunk'
                        )}
                      >
                        <span
                          className={cx(
                            'block text-sm font-medium',
                            role === a.role ? 'text-indigo' : 'text-ink-2'
                          )}
                        >
                          {a.label}
                        </span>
                        <span className="bn block text-xs text-ink-3">{a.bn}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-ink-3">{account.note}</p>
                </div>

                <Field label="NID number" htmlFor="nid" hint="The 17-digit number printed on your national ID card.">
                  <input
                    id="nid"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="1985 2691 2345 6789"
                    className={`${inputClass} mono tnum`}
                  />
                </Field>

                <Field label="Mobile number" htmlFor="phone" hint="The code goes to the number on the record.">
                  <input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="01711-223344"
                    className={`${inputClass} mono tnum`}
                  />
                </Field>

                {error && (
                  <p className="border-l-2 border-seal bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
                )}

                <Button variant="primary" type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? 'Sending code' : 'Send code'}
                  {!busy && <ArrowRight className="h-4 w-4" />}
                </Button>

                <div className="border-t border-line-hair pt-4">
                  <p className="mono text-2xs uppercase text-ink-3">Demo account</p>
                  <p className="mt-1.5 text-sm text-ink-2">
                    {account.name} · <span className="mono">{account.nid}</span>
                  </p>
                  <button
                    type="button"
                    onClick={fillDemo}
                    className="mt-2 text-sm text-indigo underline underline-offset-2"
                  >
                    Fill these in for me
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={verify} className="mt-7 space-y-5">
                <p className="text-sm text-ink-2">
                  A six-digit code went to <span className="mono">{phone || account.phone}</span>. In this demo
                  the code is always{' '}
                  <span className="mono font-semibold text-ink">{account.otp}</span>.
                </p>

                <Field label="Six-digit code" htmlFor="code">
                  <input
                    id="code"
                    ref={codeRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="······"
                    className={`${inputClass} mono tnum text-center text-lg tracking-[0.5em]`}
                  />
                </Field>

                {error && (
                  <p className="border-l-2 border-seal bg-seal-soft px-3 py-2 text-sm text-seal">{error}</p>
                )}

                <Button variant="primary" type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {busy ? 'Opening your record' : 'Open my record'}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('identity');
                    setCode('');
                    setError(null);
                  }}
                  className="flex items-center gap-1.5 text-sm text-ink-2 transition-colors duration-1 hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Change the number
                </button>
              </form>
            )}
          </div>

          <p className="mx-auto mt-5 max-w-md text-xs text-ink-3">
            Demonstration only. No real identity is checked, no records are authoritative, and nothing entered
            here reaches any government system.
          </p>
        </div>
      </div>
    </div>
  );
}
