import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Compass,
  Landmark,
  LogOut,
  Menu,
  Receipt,
  Scale,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  Calculator,
  ShieldAlert,
} from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { getParcel, getSource, listParcels, onSourceChange, readSession, writeSession } from '../lib/api';
import type { DataSource } from '../lib/api';
import type { Parcel } from '../lib/types';
import { cx, decimals, taka } from '../lib/format';
import { Button, StatusMark, ThemeToggle, inputClass } from '../components/ui';
import { TypedId } from '../components/motion';
import Overview from './panels/Overview';
import MapPanel from './panels/MapPanel';
import TaxPanel from './panels/TaxPanel';
import MutationsPanel from './panels/MutationsPanel';
import ChecksPanel from './panels/ChecksPanel';
import ServicesPanel from './panels/ServicesPanel';
import LandCalculatorModal from '../components/LandCalculatorModal';
import DisputeModal from '../components/DisputeModal';
import type { Theme } from '../lib/theme';

type TabId = 'overview' | 'map' | 'tax' | 'mutations' | 'checks' | 'services';

export default function Dashboard({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { navigate } = useRouter();
  const session = readSession();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const initialParcel = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get('parcel');
    return q || session?.parcels?.[0] || 'BD-DHK-SAV-000001';
  }, [session]);

  const [parcelId, setParcelId] = useState(initialParcel);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [all, setAll] = useState<Parcel[]>([]);
  const [tab, setTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [query, setQuery] = useState(initialParcel);
  const [navOpen, setNavOpen] = useState(false);
  const [source, setSourceState] = useState<DataSource>(getSource());
  const [calcOpen, setCalcOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Parcel[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => onSourceChange(setSourceState) as unknown as () => void, []);

  // No session, redirect to signin
  useEffect(() => {
    if (!session) navigate('/signin', { replace: true });
  }, [session, navigate]);

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const load = useCallback(async (id: string) => {
    setLoading(true);
    setNotFound(false);
    const data = await getParcel(id);
    if (data) setParcel(data);
    else setNotFound(true);
    setLoading(false);
  }, []);

  useEffect(() => {
    listParcels().then(setAll);
  }, []);

  useEffect(() => {
    load(parcelId);
  }, [parcelId, load]);

  // Instant search filtering
  useEffect(() => {
    if (query.trim()) {
      listParcels(query).then(setSearchResults);
    } else {
      setSearchResults([]);
    }
  }, [query]);

  const openParcel = (id: string) => {
    setParcelId(id);
    setQuery(id);
    setNavOpen(false);
    setSearchFocused(false);
    window.history.replaceState({}, '', `/app?parcel=${encodeURIComponent(id)}`);
  };

  const signOut = () => {
    writeSession(null);
    navigate('/');
  };

  const dueTax = parcel?.taxRecords?.find((t) => t.status === 'PENDING') ?? null;
  const openMutations = parcel?.mutations?.filter((m) => m.status !== 'APPROVED' && m.status !== 'REJECTED') ?? [];
  const flags = parcel?.discrepancies?.filter((d) => !d.isResolved) ?? [];
  const isOfficer = session?.role === 'officer';

  const tabs: Array<{ id: TabId; en: string; bn: string; icon: typeof UserCheck; mark?: string }> = [
    { id: 'overview', en: 'Overview', bn: 'সারসংক্ষেপ', icon: UserCheck },
    { id: 'map', en: 'Map', bn: 'নকশা', icon: Compass },
    { id: 'tax', en: 'Land tax', bn: 'ভূমি কর', icon: Receipt, mark: dueTax ? 'Due' : undefined },
    {
      id: 'mutations',
      en: 'নামজারি',
      bn: 'Mutation',
      icon: Scale,
      mark: openMutations.length ? String(openMutations.length) : undefined,
    },
    { id: 'checks', en: 'Checks', bn: 'যাচাই', icon: ShieldCheck, mark: flags.length ? String(flags.length) : undefined },
    { id: 'services', en: 'Services', bn: 'সেবা', icon: Activity },
  ];

  return (
    <div className="relative z-10 flex min-h-screen">
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] md:hidden" onClick={() => setNavOpen(false)} />
      )}

      {/* ------------------------------------------------------- sidebar */}
      <aside
        className={cx(
          'fixed top-0 z-50 flex h-screen w-64 shrink-0 flex-col justify-between border-r border-line bg-sheet transition-transform duration-2 ease-sheet md:sticky md:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="space-y-6 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-ink text-ink">
                <Landmark className="h-3.5 w-3.5" />
              </span>
              <span className="leading-none">
                <span className="bn block text-sm font-semibold text-ink">ভূমি সেবা</span>
                <span className="mono block text-[9px] uppercase tracking-wider text-ink-3">Parcel record</span>
              </span>
            </Link>
            <button onClick={() => setNavOpen(false)} className="p-1 text-ink-3 md:hidden" aria-label="Close menu">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* parcel switcher */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="mono text-2xs uppercase text-ink-3">
                {isOfficer ? 'Jurisdiction parcels' : 'Your parcels'}
              </span>
              <span className="mono text-2xs text-ink-3">{all.length || (parcel ? 1 : 0)} records</span>
            </div>
            <ul className="space-y-px">
              {(all.length ? all : parcel ? [parcel] : []).map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => openParcel(p.id)}
                    className={cx(
                      'w-full border-l-2 px-3 py-2 text-left transition-colors duration-1',
                      p.id === parcelId
                        ? 'border-indigo bg-indigo-soft'
                        : 'border-transparent hover:border-line-strong hover:bg-ground-sunk'
                    )}
                  >
                    <span className={cx('mono block text-[11px] font-medium', p.id === parcelId ? 'text-indigo' : 'text-ink-2')}>
                      {p.id}
                    </span>
                    <span className="block text-xs text-ink-3">
                      {p.upazila}, {p.district} · {decimals(p.areaDecimal)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* modules */}
          <nav>
            <span className="mono mb-2 block text-2xs uppercase text-ink-3">This parcel</span>
            <ul className="space-y-px">
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => {
                        setTab(t.id);
                        setNavOpen(false);
                      }}
                      className={cx(
                        'flex w-full items-center justify-between gap-2 border-l-2 px-3 py-2 text-left transition-colors duration-1',
                        active
                          ? 'border-ink bg-ground-sunk font-medium'
                          : 'border-transparent hover:border-line-strong hover:bg-ground-sunk'
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <t.icon className={cx('h-3.5 w-3.5', active ? 'text-ink' : 'text-ink-3')} />
                        <span>
                          <span className={cx('block text-[13px]', active ? 'text-ink font-semibold' : 'text-ink-2')}>
                            {t.en}
                          </span>
                          <span className="bn block text-[10px] text-ink-3">{t.bn}</span>
                        </span>
                      </span>
                      {t.mark && (
                        <span
                          className={cx(
                            'mono rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
                            t.id === 'tax' ? 'bg-seal-soft text-seal' : 'bg-amber-soft text-amber'
                          )}
                        >
                          {t.mark}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Land Toolkit Fast Action */}
          <div className="border border-line bg-sheet-raised p-3">
            <span className="mono mb-1.5 block text-2xs uppercase text-ink-3">Land Calculator</span>
            <p className="text-xs text-ink-2">Unit conversions & Faraez inheritance distribution.</p>
            <Button size="sm" className="mt-2.5 w-full" onClick={() => setCalcOpen(true)}>
              <Calculator className="h-3.5 w-3.5" /> Open Toolkit
            </Button>
          </div>
        </div>

        <div className="space-y-3 border-t border-line p-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{session?.name}</p>
              {isOfficer && (
                <span className="rounded bg-indigo-soft px-1.5 py-0.5 text-[9px] font-bold text-indigo">OFFICER</span>
              )}
            </div>
            <p className="mono text-2xs uppercase text-ink-3">
              {isOfficer ? session?.office : 'Citizen Self-Service'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-ink-2 transition-colors duration-1 hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
          <p className="text-[10px] text-ink-3">
            Authoritative digital cadastre prototype · Ministry of Land & DLRS.
          </p>
        </div>
      </aside>

      {/* ---------------------------------------------------------- main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-ground/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
            <button
              onClick={() => setNavOpen(true)}
              className="rounded-md border border-line p-1.5 text-ink-2 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Smart Search Form */}
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (query.trim()) openParcel(query.trim());
                }}
                className="relative"
              >
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Search Parcel ID, Dag, Khatian, Owner... (Press '/' to focus)"
                  aria-label="Find a parcel by ID"
                  className={`${inputClass} mono h-9 py-0 pl-9 pr-7 text-xs`}
                />
                <span className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 border border-line bg-ground px-1 text-[10px] text-ink-3 sm:block">
                  /
                </span>
              </form>

              {/* Live search dropdown */}
              {searchFocused && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto border border-line bg-sheet shadow-lg">
                  {searchResults.map((sr) => (
                    <div
                      key={sr.id}
                      onClick={() => openParcel(sr.id)}
                      className="cursor-pointer border-b border-line-hair px-3.5 py-2.5 transition-colors hover:bg-indigo-soft"
                    >
                      <div className="flex items-center justify-between">
                        <span className="mono text-xs font-semibold text-indigo">{sr.id}</span>
                        <span className="text-2xs text-ink-3">{sr.upazila}, {sr.district}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-2">
                        {sr.currentOwner} · মৌজা {sr.mouza} · দাগ {sr.dagNo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={() => setCalcOpen(true)} className="hidden sm:inline-flex">
                <Calculator className="h-3.5 w-3.5" /> Tools
              </Button>
              <StatusMark tone={source === 'live' ? 'state' : 'neutral'}>
                {source === 'live' ? 'Live data' : 'Seeded data'}
              </StatusMark>
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
          </div>

          {/* Officer Notification Banner */}
          {isOfficer && (
            <div className="flex items-center justify-between border-t border-indigo/20 bg-indigo-soft px-4 py-1.5 text-xs text-indigo sm:px-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>
                  <span className="font-semibold">AC (Land) Judicial Session Active:</span> You can advance mutation stages & resolve cadastral discrepancy flags directly.
                </span>
              </div>
              <span className="mono text-2xs hidden uppercase sm:inline-block">Court Mode</span>
            </div>
          )}
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {loading && (
            <div className="border border-line bg-sheet px-5 py-16 text-center">
              <p className="mono text-2xs uppercase text-ink-3">Reading the record...</p>
            </div>
          )}

          {!loading && notFound && (
            <div className="border-l-2 border-seal bg-seal-soft px-5 py-4">
              <p className="text-sm text-seal">No parcel is recorded under that ID.</p>
              <p className="mt-1 text-sm text-ink-2">
                Try <button onClick={() => openParcel('BD-DHK-SAV-000001')} className="mono underline">BD-DHK-SAV-000001 (Dhaka)</button>,{' '}
                <button onClick={() => openParcel('BD-CTG-PAN-000492')} className="mono underline">BD-CTG-PAN-000492 (Chittagong)</button>,{' '}
                <button onClick={() => openParcel('BD-SYL-SRM-000108')} className="mono underline">BD-SYL-SRM-000108 (Sylhet)</button>, or{' '}
                <button onClick={() => openParcel('BD-RAJ-PAB-000731')} className="mono underline">BD-RAJ-PAB-000731 (Rajshahi)</button>.
              </p>
            </div>
          )}

          {!loading && parcel && (
            <>
              {/* masthead */}
              <div className="mb-6 border-b border-line pb-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <TypedId value={parcel.id} className="text-sm text-ink-2" />
                    <h1 className="sheet-title mt-1.5 text-2xl font-semibold text-ink sm:text-3xl">
                      {parcel.upazila}, {parcel.district}
                    </h1>
                    <p className="mt-1 text-sm text-ink-2">
                      {parcel.currentOwner} · <span className="bn">মৌজা {parcel.mouza}</span> ·{' '}
                      <span className="mono text-xs">দাগ {parcel.dagNo}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {dueTax ? (
                      <StatusMark tone="seal">
                        <AlertTriangle className="h-3 w-3" /> {taka(dueTax.totalDueBDT)} due
                      </StatusMark>
                    ) : (
                      <StatusMark tone="state">Tax clear</StatusMark>
                    )}
                    {openMutations.length > 0 && (
                      <StatusMark tone="amber">{openMutations.length} নামজারি open</StatusMark>
                    )}
                    {flags.length > 0 && <StatusMark tone="amber">{flags.length} flagged</StatusMark>}
                  </div>
                </div>

                {/* key figures — a register strip */}
                <dl className="mt-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                  {[
                    ['Recorded area', decimals(parcel.areaDecimal)],
                    ['খতিয়ান', parcel.khatianNo],
                    ['Land class', parcel.landClass],
                    ['Holding', parcel.holdingNo],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-sheet px-3.5 py-3">
                      <dt className="mono text-2xs uppercase text-ink-3">{k}</dt>
                      <dd className="mt-1 truncate text-[13px] text-ink" title={String(v)}>
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* tabs, horizontal on small screens */}
              <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line md:hidden">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={cx(
                      '-mb-px shrink-0 border-b-2 px-3 py-2 text-[13px] transition-colors duration-1',
                      tab === t.id ? 'border-ink text-ink font-semibold' : 'border-transparent text-ink-3'
                    )}
                  >
                    {t.en}
                  </button>
                ))}
              </div>

              <div key={tab} className="anim-sheet-in">
                {tab === 'overview' && <Overview parcel={parcel} onChanged={() => load(parcelId)} />}
                {tab === 'map' && <MapPanel parcel={parcel} />}
                {tab === 'tax' && <TaxPanel parcel={parcel} onChanged={() => load(parcelId)} />}
                {tab === 'mutations' && <MutationsPanel parcel={parcel} onChanged={() => load(parcelId)} />}
                {tab === 'checks' && <ChecksPanel parcel={parcel} onChanged={() => load(parcelId)} />}
                {tab === 'services' && <ServicesPanel parcel={parcel} />}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LandCalculatorModal
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        initialDecimal={parcel?.areaDecimal || 5.5}
      />
      {parcel && (
        <DisputeModal
          open={disputeOpen}
          onClose={() => setDisputeOpen(false)}
          parcelId={parcel.id}
          defaultOwner={parcel.currentOwner}
          defaultPhone={parcel.phone}
          onSuccess={() => load(parcelId)}
        />
      )}
    </div>
  );
}
