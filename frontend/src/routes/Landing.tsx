import React, { useState } from 'react';
import { ArrowRight, Bell, FileText, Landmark, MapPin, Scale, Search, ShieldCheck } from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { Counter, Lines, Reveal, TypedId } from '../components/motion';
import ParcelPlate from '../components/ParcelPlate';
import { Button, Eyebrow, Panel, StatusMark, ThemeToggle, inputClass } from '../components/ui';
import type { Theme } from '../lib/theme';

/* Under one Parcel ID. Not a sequence, so no 01/02/03 numbering —
   these are facets of one record, and the layout says so. */
const FACETS = [
  { key: 'ownership', en: 'Ownership', bn: 'মালিকানা', note: 'Who holds it now, and how that was recorded.' },
  { key: 'geometry', en: 'Map', bn: 'নকশা', note: 'The boundary as surveyed, against the sheet it came from.' },
  { key: 'tax', en: 'Land tax', bn: 'ভূমি উন্নয়ন কর', note: 'What is due, what was paid, and the দাখিলা for it.' },
  { key: 'mutation', en: 'Mutation', bn: 'নামজারি', note: 'Any application to change the record, and its stage.' },
  { key: 'history', en: 'History', bn: 'ইতিহাস', note: 'Every event with a date, an office, and a document.' },
  { key: 'deeds', en: 'Documents', bn: 'দলিল', note: 'Deeds, khatians and receipts, kept with the parcel.' },
  { key: 'limits', en: 'Restrictions', bn: 'বাধা', note: 'Recorded charges, cases and holds on the land.' },
  { key: 'alerts', en: 'Alerts', bn: 'সতর্কতা', note: 'A message when an office touches your record.' },
];

const COMPARE = [
  { dim: 'Where you start', old: 'Pick a service, then find the right ID', now: 'Open your parcel' },
  { dim: 'Identifiers', old: 'খতিয়ান, দাগ, holding, case number', now: 'One Parcel ID, the rest kept underneath' },
  { dim: 'Records live in', old: 'Several separate portals', now: 'One profile, many sources' },
  { dim: 'History looks like', old: 'A folder of documents', now: 'A dated timeline you can follow' },
  { dim: 'After paying', old: '"Did it go through?"', now: 'Transaction reference, then a দাখিলা' },
  { dim: 'Finding out', old: 'You check, manually', now: 'You get told' },
];

export default function Landing({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { navigate } = useRouter();
  const [lookup, setLookup] = useState('');

  const openParcel = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(lookup.trim() ? `/app?parcel=${encodeURIComponent(lookup.trim())}` : '/signin');
  };

  return (
    <div className="relative z-10">
      {/* ------------------------------------------------------------ nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-ground/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-shell items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center border border-ink text-ink">
              <Landmark className="h-3.5 w-3.5" />
            </span>
            <span className="leading-none">
              <span className="bn block text-[15px] font-semibold text-ink">ভূমি সেবা</span>
              <span className="mono block text-[9px] uppercase tracking-wider text-ink-3">Parcel record</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-ink-2 md:flex">
            <a href="#record" className="transition-colors duration-1 hover:text-ink">
              The record
            </a>
            <a href="#change" className="transition-colors duration-1 hover:text-ink">
              What changes
            </a>
            <a href="#certainty" className="transition-colors duration-1 hover:text-ink">
              Payment certainty
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <Link to="/signin">
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------- hero */}
      <section className="mx-auto max-w-shell px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <Eyebrow className="mb-6 flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 bg-indigo" />
              Demonstration build · প্রদর্শনী
            </Eyebrow>

            <Lines
              className="sheet-title text-[1.75rem] font-semibold text-ink [text-wrap:balance] sm:text-[2.35rem] lg:text-[2.9rem]"
              lines={['Everything about your land,', 'on one sheet.']}
              stagger={90}
              delay={120}
            />

            <p className="bn mt-4 text-lg text-ink-2">আপনার জমির সব তথ্য — এক জায়গায়।</p>

            <p className="mt-6 max-w-measure text-base text-ink-2">
              Ownership, খতিয়ান, নামজারি, ভূমি উন্নয়ন কর, the map and the full history sit under a single
              Parcel ID. Look the parcel up once, instead of checking four portals and hoping they agree.
            </p>

            <form onSubmit={openParcel} className="mt-8 max-w-md">
              <label htmlFor="lookup" className="mono mb-2 block text-2xs uppercase text-ink-3">
                Try a parcel ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                  <input
                    id="lookup"
                    value={lookup}
                    onChange={(e) => setLookup(e.target.value)}
                    placeholder="BD-DHK-SAV-000001"
                    className={`${inputClass} mono pl-9 text-[13px]`}
                  />
                </div>
                <Button variant="primary" type="submit">
                  Open
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-3">
                Four national parcels loaded:{' '}
                <button
                  type="button"
                  onClick={() => setLookup('BD-DHK-SAV-000001')}
                  className="mono text-indigo underline underline-offset-2"
                >
                  Dhaka
                </button>
                {', '}
                <button
                  type="button"
                  onClick={() => setLookup('BD-CTG-PAN-000492')}
                  className="mono text-indigo underline underline-offset-2"
                >
                  Chittagong
                </button>
                {', '}
                <button
                  type="button"
                  onClick={() => setLookup('BD-SYL-SRM-000108')}
                  className="mono text-indigo underline underline-offset-2"
                >
                  Sylhet
                </button>
                {' & '}
                <button
                  type="button"
                  onClick={() => setLookup('BD-RAJ-PAB-000731')}
                  className="mono text-indigo underline underline-offset-2"
                >
                  Rajshahi
                </button>
              </p>
            </form>
          </div>

          {/* the signature */}
          <div className="reg-mark relative border border-line bg-sheet p-5 sm:p-7">
            <div className="mb-4 flex items-center justify-between">
              <TypedId value="BD-DHK-SAV-000001" className="text-[13px] text-ink" />
              <StatusMark tone="state">
                <ShieldCheck className="h-3 w-3" /> On record
              </StatusMark>
            </div>
            <ParcelPlate />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- what's in a record */}
      <section id="record" className="border-y border-line bg-sheet/50">
        <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <Eyebrow>Under one Parcel ID</Eyebrow>
            <h2 className="sheet-title mt-3 max-w-measure text-2xl font-semibold text-ink sm:text-3xl">
              Eight kinds of record, kept together.
            </h2>
            <p className="mt-3 max-w-measure text-ink-2">
              They already exist across government systems. What is missing is one place where they agree
              with each other, in front of the person who owns the land.
            </p>
          </Reveal>

          <dl className="mt-10 grid gap-x-10 border-t border-line sm:grid-cols-2">
            {FACETS.map((f, i) => (
              <Reveal
                key={f.key}
                delay={i * 45}
                className="flex items-baseline gap-4 border-b border-line-hair py-4"
              >
                <dt className="w-[132px] shrink-0">
                  <span className="block text-sm font-medium text-ink">{f.en}</span>
                  <span className="bn block text-xs text-ink-3">{f.bn}</span>
                </dt>
                <dd className="text-sm text-ink-2">{f.note}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* --------------------------------------------------------- compare */}
      <section id="change" className="mx-auto max-w-shell px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <Eyebrow>What changes</Eyebrow>
          <h2 className="sheet-title mt-3 max-w-measure text-2xl font-semibold text-ink sm:text-3xl">
            The services are already digital. The experience is still service-centric.
          </h2>
        </Reveal>

        <div className="mt-10 overflow-hidden border border-line bg-sheet rounded-lg">
          <div className="mono grid grid-cols-[1fr] gap-0 border-b border-line px-4 py-2.5 text-2xs uppercase text-ink-3 sm:grid-cols-[180px_1fr_1fr] sm:px-5">
            <span className="hidden sm:block" />
            <span>Today</span>
            <span className="text-indigo">Parcel-centric</span>
          </div>
          {COMPARE.map((row, i) => (
            <Reveal
              key={row.dim}
              delay={i * 40}
              className="grid grid-cols-1 gap-1 border-b border-line-hair px-4 py-3.5 last:border-0 sm:grid-cols-[180px_1fr_1fr] sm:gap-4 sm:px-5"
            >
              <span className="mono text-2xs uppercase text-ink-3">{row.dim}</span>
              <span className="text-sm text-ink-3 line-through decoration-line-strong decoration-1">{row.old}</span>
              <span className="text-sm text-ink">{row.now}</span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- certainty */}
      <section id="certainty" className="border-y border-line bg-sheet/50">
        <div className="mx-auto grid max-w-shell gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <Eyebrow>Payment certainty</Eyebrow>
            <h2 className="sheet-title mt-3 text-2xl font-semibold text-ink sm:text-3xl">
              Never pay the same tax twice.
            </h2>
            <p className="mt-4 max-w-measure text-ink-2">
              The uncertainty after paying ভূমি উন্নয়ন কর is the part people actually complain about. A
              permanent transaction reference, a state you can read, and a দাখিলা at the end of it. This is a
              real sequence, so it is numbered.
            </p>

            <ol className="mt-8 border-t border-line">
              {[
                { n: '01', t: 'Amount shown before you pay', d: 'Demand and arrears separated, with the fiscal year named.' },
                { n: '02', t: 'Reference issued immediately', d: 'A permanent ID that survives a dropped connection.' },
                { n: '03', t: 'Reconciled against the gateway', d: 'The record and the payment provider are matched, not assumed.' },
                { n: '04', t: 'দাখিলা generated', d: 'Verifiable receipt, stored with the parcel and printable.' },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 60} as="li" className="flex gap-5 border-b border-line-hair py-4">
                  <span className="mono text-xs text-indigo">{s.n}</span>
                  <span>
                    <span className="block text-sm font-medium text-ink">{s.t}</span>
                    <span className="mt-0.5 block text-sm text-ink-2">{s.d}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={120} className="flex flex-col gap-4">
            <Panel label="Tax account" meta="1433–1434">
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between border-b border-line-hair pb-2.5">
                  <span className="text-sm text-ink-3">
                    Annual demand <span className="bn text-xs">বার্ষিক দাবি</span>
                  </span>
                  <span className="mono tnum text-sm text-ink">
                    ৳<Counter to={1350} />
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-b border-line-hair pb-2.5">
                  <span className="text-sm text-ink-3">Arrears</span>
                  <span className="mono tnum text-sm text-ink">৳0</span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-sm font-medium text-ink">Due now</span>
                  <span className="mono tnum text-lg font-semibold text-ink">
                    ৳<Counter to={1350} duration={1100} />
                  </span>
                </div>
              </div>
            </Panel>

            <Panel label="Activity alert" meta="28 Jul 2026">
              <div className="flex gap-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <div>
                  <p className="text-sm text-ink">Someone filed a নামজারি on your parcel.</p>
                  <p className="mt-1 text-sm text-ink-2">
                    Kamal Hossain applied as a co-heir. Hearing set for 10 Sep at the Savar land office.
                  </p>
                  <p className="mono mt-2 text-2xs uppercase text-ink-3">MUT-2026-DH-1044</p>
                </div>
              </div>
              <p className="mt-4 border-t border-line-hair pt-3 text-xs text-ink-3">
                An alert says activity was detected. It does not call anything fraud.
              </p>
            </Panel>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------------- demo contents */}
      <section className="mx-auto max-w-shell px-4 py-16 sm:px-6">
        <Reveal>
          <Eyebrow>What is in this build</Eyebrow>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          {[
            { n: 4, label: 'National parcels', icon: MapPin },
            { n: 8, label: 'Record types joined', icon: FileText },
            { n: 5, label: 'নামজারি stages', icon: Scale },
            { n: 12, label: 'REST endpoints', icon: ShieldCheck },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 60} className="bg-sheet px-4 py-6">
              <s.icon className="h-4 w-4 text-ink-3" />
              <p className="sheet-title mt-3 text-2xl font-semibold text-ink">
                <Counter to={s.n} duration={800} />
              </p>
              <p className="mt-1 text-xs text-ink-3">{s.label}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-3">
          Counts describe this demonstration build, not national coverage.
        </p>
      </section>

      {/* -------------------------------------------------------------- cta */}
      <section className="border-t border-line">
        <div className="mx-auto flex max-w-shell flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="sheet-title text-2xl font-semibold text-ink">Open the demo record.</h2>
            <p className="mt-2 text-sm text-ink-2">
              Sign in as a citizen or as a land office. No password, no account.
            </p>
          </div>
          <Link to="/signin">
            <Button variant="primary">
              Sign in to the demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ----------------------------------------------------------- footer */}
      <footer className="border-t border-line bg-sheet/60">
        <div className="mx-auto max-w-shell px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="bn text-sm font-semibold text-ink">ভূমি সেবা</p>
              <p className="mt-1 text-xs text-ink-3">
                Land service helpline <span className="mono">16122</span>
              </p>
            </div>
            <p className="max-w-measure text-xs text-ink-3">
              This is an unaffiliated demonstration interface built from public feature research. It is not an
              official service of the Ministry of Land, holds no authoritative records, and must not be used
              for any legal or financial decision.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
