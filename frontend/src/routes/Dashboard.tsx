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
  Github,
  History,
  FileCheck,
  Lock,
  Unlock,
  BellRing,
} from 'lucide-react';
import { Link, useRouter } from '../lib/router';
import { getParcel, getSource, listParcels, onSourceChange, readSession, writeSession } from '../lib/api';
import type { DataSource } from '../lib/api';
import type { Parcel } from '../lib/types';
import { cx, decimals, taka } from '../lib/format';
import { Button, StatusMark, ThemeToggle, LanguageToggle, inputClass } from '../components/ui';
import { useLanguage } from '../lib/language';
import { TypedId } from '../components/motion';
import { useGSAP, gsap, prefersReducedMotion } from '../lib/gsap';
import Overview from './panels/Overview';
import MapPanel from './panels/MapPanel';
import LineagePanel from './panels/LineagePanel';
import DueDiligencePanel from './panels/DueDiligencePanel';
import TaxPanel from './panels/TaxPanel';
import MutationsPanel from './panels/MutationsPanel';
import ChecksPanel from './panels/ChecksPanel';
import ServicesPanel from './panels/ServicesPanel';
import OfficerWorkbenchPanel from './panels/OfficerWorkbenchPanel';
import LandCalculatorModal from '../components/LandCalculatorModal';
import DisputeModal from '../components/DisputeModal';
import LandLockModal from '../components/LandLockModal';
import AlertRadarModal from '../components/AlertRadarModal';
import type { Theme } from '../lib/theme';

type TabId = 'workbench' | 'overview' | 'map' | 'lineage' | 'diligence' | 'tax' | 'mutations' | 'checks' | 'services';

export default function Dashboard({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const { navigate } = useRouter();
  const { lang, toggleLang, t, pickLang, formatArea } = useLanguage();
  const session = readSession();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const initialParcel = useMemo(() => {
    const q = new URLSearchParams(window.location.search).get('parcel');
    return q || session?.parcels?.[0] || 'BD-DHK-SAV-000001';
  }, [session]);

  const [parcelId, setParcelId] = useState(initialParcel);
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [all, setAll] = useState<Parcel[]>([]);
  const [tab, setTab] = useState<TabId>(session?.role === 'officer' ? 'workbench' : 'overview');

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [query, setQuery] = useState(initialParcel);
  const [navOpen, setNavOpen] = useState(false);
  const [source, setSourceState] = useState<DataSource>(getSource());
  const [calcOpen, setCalcOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Parcel[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Panel switch: fade + rise the whole panel, then let its top-level
  // sections settle in with a light stagger — no reflow, opacity/transform only.
  useGSAP(
    () => {
      const el = panelRef.current;
      if (!el || prefersReducedMotion()) return;
      const sections = el.children.length ? Array.from(el.children) : [el];
      gsap.fromTo(
        sections,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.05 }
      );
    },
    { dependencies: [tab], scope: panelRef }
  );

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

  // Officer jurisdiction totals across all parcels
  const totalOfficerMutations = useMemo(() => {
    return all.reduce((acc, p) => {
      const pending = (p.mutations ?? []).filter((m) => m.status !== 'APPROVED' && m.status !== 'REJECTED');
      return acc + pending.length;
    }, 0);
  }, [all]);

  const totalOfficerFlags = useMemo(() => {
    return all.reduce((acc, p) => {
      const unresolved = (p.discrepancies ?? []).filter((d) => !d.isResolved);
      return acc + unresolved.length;
    }, 0);
  }, [all]);

  const totalOfficerQueue = totalOfficerMutations + totalOfficerFlags;

  const tabs: Array<{ id: TabId; label: string; icon: typeof UserCheck; mark?: string }> = [
    ...(isOfficer
      ? [
        {
          id: 'workbench' as TabId,
          label: t('Court Workbench', 'রাজস্ব আদালত ও কজ লিস্ট'),
          icon: Landmark,
          mark: totalOfficerQueue > 0 ? String(totalOfficerQueue) : undefined,
        },
      ]
      : []),
    { id: 'overview', label: t('Overview', 'সারসংক্ষেপ'), icon: UserCheck },
    { id: 'map', label: t('Map & GIS', 'নকশা ও জরিপ'), icon: Compass },
    { id: 'lineage', label: t('Chain of Title', 'মালিকানা চেইন'), icon: History },
    { id: 'diligence', label: t('Due Diligence', 'যাচাই সনদ'), icon: FileCheck },
    { id: 'tax', label: t('Land Tax', 'ভূমি উন্নয়ন কর'), icon: Receipt, mark: dueTax ? t('Due', 'বকেয়া') : undefined },
    {
      id: 'mutations',
      label: t('Mutation', 'নামজারি'),
      icon: Scale,
      mark: openMutations.length ? String(openMutations.length) : undefined,
    },
    { id: 'checks', label: t('Reconciliation', 'যাচাই ও অডিট'), icon: ShieldCheck, mark: flags.length ? String(flags.length) : undefined },
    { id: 'services', label: t('Services', 'নাগরিক সেবা'), icon: Activity },
  ];

  return (
    <div className="relative z-10 flex min-h-screen">
      {navOpen && (
        <div className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[2px] md:hidden" onClick={() => setNavOpen(false)} />
      )}

      {/* ------------------------------------------------------- sidebar */}
      <aside
        className={cx(
          'fixed top-0 z-50 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-sheet transition-transform duration-2 ease-sheet md:sticky md:top-0 md:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-ink text-ink">
                <Landmark className="h-3.5 w-3.5" />
              </span>
              <span className="leading-none">
                <span className="bn block text-sm font-semibold text-ink">ভূমি সেবা</span>
                <span className="mono block text-[9px] uppercase tracking-wider text-ink-3">
                  {t('Parcel record', 'স্মার্ট ভূমি পোর্টাল')}
                </span>
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
                {isOfficer ? t('Jurisdiction parcels', 'এলাকাধীন খতিয়ান') : t('Your parcels', 'আপনার রেকর্ডসমূহ')}
              </span>
              <span className="mono text-2xs text-ink-3">
                {all.length || (parcel ? 1 : 0)} {t('records', 'টি রেকর্ড')}
              </span>
            </div>
            <ul className="space-y-px">
              {(all.length ? all : parcel ? [parcel] : []).map((p) => {
                const pMut = (p.mutations ?? []).filter((m) => m.status !== 'APPROVED' && m.status !== 'REJECTED').length;
                const pFlg = (p.discrepancies ?? []).filter((d) => !d.isResolved).length;
                const pBadge = pMut + pFlg;
                return (
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
                      <div className="flex items-center justify-between">
                        <span className={cx('mono block text-[11px] font-medium', p.id === parcelId ? 'text-indigo' : 'text-ink-2')}>
                          {p.id}
                        </span>
                        {isOfficer && pBadge > 0 && (
                          <span className="mono rounded bg-amber-soft px-1 text-[9px] font-bold text-amber">
                            {pBadge} {t('act', 'কেস')}
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-ink-3">
                        {p.upazila}, {p.district} · {formatArea(p.areaDecimal)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* modules */}
          <nav>
            <span className="mono mb-2 block text-2xs uppercase text-ink-3">
              {t('This parcel', 'নির্বাচিত খতিয়ান')}
            </span>
            <ul className="space-y-px">
              {tabs.map((tItem) => {
                const active = tab === tItem.id;
                return (
                  <li key={tItem.id}>
                    <button
                      onClick={() => {
                        setTab(tItem.id);
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
                        <tItem.icon className={cx('h-3.5 w-3.5', active ? 'text-ink' : 'text-ink-3')} />
                        <span className={cx('block text-[13px]', active ? 'text-ink font-semibold' : 'text-ink-2')}>
                          {tItem.label}
                        </span>
                      </span>
                      {tItem.mark && (
                        <span
                          className={cx(
                            'mono rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
                            tItem.id === 'tax' ? 'bg-seal-soft text-seal' : 'bg-amber-soft text-amber'
                          )}
                        >
                          {tItem.mark}
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

        <div className="shrink-0 space-y-3 border-t border-line p-4">
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
            <LogOut className="h-3.5 w-3.5" /> {t('Sign out', 'লগআউট')}
          </button>
          <div className="border-t border-line-hair pt-2.5">
            <a
              href="https://github.com/pbs002-s"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-[11px] text-ink-3 transition-colors hover:text-indigo"
            >
              <span>{t('Engineered by', 'নির্মাতা')}</span>
              <span className="flex items-center gap-1 font-semibold text-ink">
                <Github className="h-3 w-3 text-indigo" />
                pbs002-s
              </span>
            </a>
            <p className="mt-1 text-[10px] text-ink-3">
              {t('Authoritative digital cadastre prototype.', 'জাতীয় ডিজিটাল ভূমি ব্যবস্থাপনা প্রোটোটাইপ।')}
            </p>
          </div>
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
              {parcel && (
                <Button
                  size="sm"
                  variant={parcel.isLocked ? 'primary' : 'secondary'}
                  onClick={() => setLockOpen(true)}
                  className="hidden sm:inline-flex"
                  title="Citizen Digital Land Lock"
                >
                  {parcel.isLocked ? <Lock className="h-3.5 w-3.5 text-state" /> : <Unlock className="h-3.5 w-3.5" />}
                  {parcel.isLocked ? t('Land Locked', 'ভূমি লক সক্রিয়') : t('Land Lock', 'ভূমি লক')}
                </Button>
              )}
              {parcel && (
                <button
                  onClick={() => setRadarOpen(true)}
                  className="flex items-center gap-1.5 rounded border border-line bg-sheet px-2.5 py-1.5 text-xs text-ink-2 hover:bg-ground-sunk"
                  title="Citizen SMS Alert Radar"
                >
                  <BellRing className="h-3.5 w-3.5 text-indigo" />
                  <span className="hidden lg:inline">{t('Radar', 'রাডার')}</span>
                </button>
              )}
              <Button size="sm" onClick={() => setCalcOpen(true)} className="hidden sm:inline-flex">
                <Calculator className="h-3.5 w-3.5" /> {t('Tools', 'টুলস')}
              </Button>
              <StatusMark tone={source === 'live' ? 'state' : 'neutral'}>
                {source === 'live' ? t('Live data', 'লাইভ ডেটা') : t('Seeded data', 'ডেমো ডেটা')}
              </StatusMark>
              <LanguageToggle lang={lang} onToggle={toggleLang} />
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
          </div>

          {/* Officer Notification Banner */}
          {isOfficer && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-indigo/20 bg-indigo-soft px-4 py-2 text-xs text-indigo sm:px-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 text-indigo" />
                <span>
                  <span className="font-semibold">AC (Land) Judicial Court Active:</span> {session?.name} &middot; {session?.office || 'Savar Revenue Circle'} &middot; {totalOfficerQueue} pending jurisdiction items.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={tab === 'workbench' ? 'primary' : 'secondary'}
                  onClick={() => setTab('workbench')}
                  className="h-7 text-2xs"
                >
                  <Scale className="h-3 w-3" />
                  {tab === 'workbench' ? t('Viewing Cause List', 'কজ লিস্টে আছেন') : t('Open Cause List', 'দৈনিক কজ লিস্ট ও বেঞ্চ')}
                </Button>
                <span className="mono text-2xs hidden uppercase sm:inline-block">Executive Magistrate</span>
              </div>
            </div>
          )}
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          {tab === 'workbench' && isOfficer ? (
            <OfficerWorkbenchPanel
              parcels={all.length ? all : parcel ? [parcel] : []}
              onSelectParcel={(pId) => {
                openParcel(pId);
                setTab('overview');
              }}
              onRefresh={() => {
                listParcels().then(setAll);
                load(parcelId);
              }}
            />
          ) : (
            <>
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
                          <span className="font-semibold">{pickLang(parcel.currentOwner)}</span> &middot;{' '}
                          <span>{t(`Mouza ${parcel.mouza}`, `মৌজা ${parcel.mouza}`)}</span> &middot;{' '}
                          <span className="mono text-xs">{t(`Plot ${parcel.dagNo}`, `দাগ ${parcel.dagNo}`)}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {parcel.isLocked && (
                          <StatusMark tone="state">
                            <Lock className="h-3 w-3" /> {t('Record Locked', 'ভূমি লক সক্রিয়')}
                          </StatusMark>
                        )}
                        {dueTax ? (
                          <StatusMark tone="seal">
                            <AlertTriangle className="h-3 w-3" /> {taka(dueTax.totalDueBDT)} {t('due', 'বকেয়া')}
                          </StatusMark>
                        ) : (
                          <StatusMark tone="state">{t('Tax clear', 'কর পরিশোধিত')}</StatusMark>
                        )}
                        {openMutations.length > 0 && (
                          <StatusMark tone="amber">
                            {openMutations.length} {t('mutation active', 'নামজারি চলমান')}
                          </StatusMark>
                        )}
                        {flags.length > 0 && (
                          <StatusMark tone="amber">
                            {flags.length} {t('flagged', 'চিহ্নিত')}
                          </StatusMark>
                        )}
                      </div>
                    </div>

                    {/* key figures — a register strip */}
                    <dl className="mt-5 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
                      {[
                        [t('Recorded Area', 'জমির পরিমাণ'), formatArea(parcel.areaDecimal)],
                        [t('Khatian No', 'খতিয়ান নং'), parcel.khatianNo],
                        [t('Land Class', 'জমির শ্রেণি'), pickLang(parcel.landClass)],
                        [t('Holding No', 'হোল্ডিং নং'), parcel.holdingNo],
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
                    {tabs.map((tItem) => (
                      <button
                        key={tItem.id}
                        onClick={() => setTab(tItem.id)}
                        className={cx(
                          '-mb-px shrink-0 border-b-2 px-3 py-2 text-[13px] transition-colors duration-1',
                          tab === tItem.id ? 'border-ink text-ink font-semibold' : 'border-transparent text-ink-3'
                        )}
                      >
                        {tItem.label}
                      </button>
                    ))}
                  </div>

                  <div key={tab} ref={panelRef}>
                    {tab === 'overview' && <Overview parcel={parcel} onChanged={() => load(parcelId)} />}
                    {tab === 'map' && <MapPanel parcel={parcel} />}
                    {tab === 'lineage' && <LineagePanel parcel={parcel} />}
                    {tab === 'diligence' && <DueDiligencePanel parcel={parcel} />}
                    {tab === 'tax' && <TaxPanel parcel={parcel} onChanged={() => load(parcelId)} />}
                    {tab === 'mutations' && <MutationsPanel parcel={parcel} onChanged={() => load(parcelId)} />}
                    {tab === 'checks' && <ChecksPanel parcel={parcel} onChanged={() => load(parcelId)} />}
                    {tab === 'services' && <ServicesPanel parcel={parcel} />}
                  </div>
                </>
              )}
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
      {parcel && (
        <LandLockModal
          open={lockOpen}
          onClose={() => setLockOpen(false)}
          parcel={parcel}
          onSuccess={() => load(parcelId)}
        />
      )}
      {parcel && (
        <AlertRadarModal
          open={radarOpen}
          onClose={() => setRadarOpen(false)}
          parcel={parcel}
        />
      )}
    </div>
  );

}
