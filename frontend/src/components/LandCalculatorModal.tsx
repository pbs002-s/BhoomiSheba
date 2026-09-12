import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button, Field, inputClass, DataRow } from './ui';
import { convertLandUnits, calculateFaraez } from '../lib/api';
import type { LandUnits, FaraezShare } from '../lib/types';
import { taka } from '../lib/format';
import { useLanguage } from '../lib/language';

interface Props {
  open: boolean;
  onClose: () => void;
  initialDecimal?: number;
}

type TabType = 'convert' | 'faraez' | 'kharij' | 'tax';

export default function LandCalculatorModal({ open, onClose, initialDecimal = 5.5 }: Props) {
  const { lang, t, pickLang } = useLanguage();
  const [tab, setTab] = useState<TabType>('convert');
  const [draftedMutation, setDraftedMutation] = useState<string | null>(null);


  // Conversion State
  const [val, setVal] = useState<number>(initialDecimal);
  const [unit, setUnit] = useState<'decimal' | 'katha' | 'bigha' | 'acre' | 'sqft' | 'sqm'>('decimal');
  const [converted, setConverted] = useState<LandUnits | null>(null);

  // Faraez State
  const [fArea, setFArea] = useState<number>(initialDecimal);
  const [sons, setSons] = useState<number>(2);
  const [daughters, setDaughters] = useState<number>(1);
  const [wife, setWife] = useState<number>(1);
  const [husband, setHusband] = useState<number>(0);
  const [father, setFather] = useState<number>(0);
  const [mother, setMother] = useState<number>(1);
  const [faraezShares, setFaraezShares] = useState<FaraezShare[]>([]);
  const [faraezTotal, setFaraezTotal] = useState<number>(0);

  // Tax Estimator State
  const [tClass, setTClass] = useState<string>('Homestead — বাস্তুভিটা');
  const [tArea, setTArea] = useState<number>(initialDecimal);

  // Run conversion whenever val or unit changes, but only while the
  // calculator is actually open — this component stays mounted (hidden)
  // the rest of the time, and firing network calls from a closed modal
  // both wastes requests and can misrepresent the live/demo data badge.
  useEffect(() => {
    if (!open) return;
    convertLandUnits(val || 0, unit).then(setConverted);
  }, [open, val, unit]);

  // Run Faraez calculation
  const handleFaraez = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = await calculateFaraez({
      totalDecimal: fArea || 0,
      sons,
      daughters,
      wife,
      husband,
      father,
      mother,
    });
    setFaraezShares(res.shares);
    setFaraezTotal(res.totalDistributed);
  };

  useEffect(() => {
    if (open && tab === 'faraez') handleFaraez();
  }, [open, tab, fArea, sons, daughters, wife, husband, father, mother]);

  // Calculate estimated tax
  const estimatedTax = React.useMemo(() => {
    let rate = 50;
    if (tClass.includes('Commercial') || tClass.includes('বাণিজ্যিক')) rate = 400;
    else if (tClass.includes('Industrial') || tClass.includes('শিল্প')) rate = 300;
    else if (tClass.includes('Agricultural') || tClass.includes('কৃষি')) rate = tArea <= 825 ? 5 : 15;
    return Math.max(100, Math.round((tArea || 0) * rate));
  }, [tClass, tArea]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      label="Land Tools"
      title="ভূমি ক্যালকুলেটর ও ফারায়েজ"
      bn="Land measurement & inheritance suite"
      wide
    >
      <div className="space-y-5">
        {/* Sub-navigation tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border border-line bg-line">
          {[
            { id: 'convert' as const, en: 'Unit Converter', bn: 'পরিমাপ রূপান্তর' },
            { id: 'faraez' as const, en: 'Faraez Inheritance', bn: 'ফারায়েজ বণ্টন' },
            { id: 'kharij' as const, en: 'Kharij Partition', bn: 'জমা ভাগ ও খারিজ নকশা' },
            { id: 'tax' as const, en: 'Tax Estimator', bn: 'কর হিসাব' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2.5 text-center transition-colors duration-1 ${
                tab === t.id ? 'bg-indigo-soft text-indigo font-medium' : 'bg-sheet text-ink-2 hover:bg-ground-sunk'
              }`}
            >
              <span className="block text-xs font-semibold">{t.en}</span>
              <span className="bn block text-2xs text-ink-3">{t.bn}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Unit Converter */}
        {tab === 'convert' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('Input Value', 'পরিমাপের মান')} htmlFor="cval">
                <input
                  id="cval"
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label={t('From Unit', 'বর্তমান একক')} htmlFor="cunit">
                <select
                  id="cunit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="decimal">{t('Decimal / Shotok', 'শতক / ডেসিমেল')}</option>
                  <option value="katha">{t('Katha (1.65 Decimal)', 'কাঠা (১.৬৫ শতক)')}</option>
                  <option value="bigha">{t('Bigha (33 Decimal)', 'বিঘা (৩৩ শতক)')}</option>
                  <option value="acre">{t('Acre (100 Decimal)', 'একর (১০০ শতক)')}</option>
                  <option value="sqft">{t('Square Feet', 'বর্গফুট')}</option>
                  <option value="sqm">{t('Square Metre', 'বর্গমিটার')}</option>
                </select>
              </Field>
            </div>

            {converted && (
              <div className="border border-line bg-sheet-raised p-4">
                <p className="mono mb-3 text-2xs uppercase text-ink-3">
                  {t('Standard Bangladesh Conversions (DLRS)', 'সরকারি ভূমি পরিমাপক রূপান্তর (ডিএলআরএস)')}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DataRow label={t('Decimal', 'শতক')} value={`${converted.decimal} ${t('dec', 'শতক')}`} mono />
                  <DataRow label={t('Katha', 'কাঠা')} value={`${converted.katha} ${t('katha', 'কাঠা')}`} mono />
                  <DataRow label={t('Bigha', 'বিঘা')} value={`${converted.bigha} ${t('bigha', 'বিঘা')}`} mono />
                  <DataRow label={t('Acre', 'একর')} value={`${converted.acre} ${t('acre', 'একর')}`} mono />
                  <DataRow label={t('Square Feet', 'বর্গফুট')} value={`${converted.squareFeet.toLocaleString()} ${t('sq ft', 'বর্গফুট')}`} mono />
                  <DataRow label={t('Square Metre', 'বর্গমিটার')} value={`${converted.squareMetres.toLocaleString()} ${t('sq m', 'বর্গমিটার')}`} mono />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Faraez Inheritance Calculator */}
        {tab === 'faraez' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label={t('Total Land (Decimal)', 'মোট জমি (শতক)')} htmlFor="farea">
                <input
                  id="farea"
                  type="number"
                  step="any"
                  value={fArea}
                  onChange={(e) => setFArea(parseFloat(e.target.value) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label={t('Sons', 'পুত্র সন্তান')} htmlFor="fsons">
                <input
                  id="fsons"
                  type="number"
                  min="0"
                  value={sons}
                  onChange={(e) => setSons(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label={t('Daughters', 'কন্যা সন্তান')} htmlFor="fdaughters">
                <input
                  id="fdaughters"
                  type="number"
                  min="0"
                  value={daughters}
                  onChange={(e) => setDaughters(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label={t('Wife', 'স্ত্রী')} htmlFor="fwife">
                <input
                  id="fwife"
                  type="number"
                  min="0"
                  max="4"
                  value={wife}
                  onChange={(e) => setWife(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('Husband', 'স্বামী')} htmlFor="fhus">
                <input
                  id="fhus"
                  type="number"
                  min="0"
                  max="1"
                  value={husband}
                  onChange={(e) => setHusband(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label={t('Father', 'পিতা')} htmlFor="ffather">
                <input
                  id="ffather"
                  type="number"
                  min="0"
                  max="1"
                  value={father}
                  onChange={(e) => setFather(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label={t('Mother', 'মাতা')} htmlFor="fmother">
                <input
                  id="fmother"
                  type="number"
                  min="0"
                  max="1"
                  value={mother}
                  onChange={(e) => setMother(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
            </div>

            {faraezShares.length > 0 ? (
              <div className="border border-line bg-sheet-raised p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="mono text-2xs uppercase text-ink-3">
                    {t('Inheritance Distribution', 'ওয়ারিশভিত্তিক সম্পত্তি বণ্টন')}
                  </p>
                  <p className="mono text-xs text-indigo">
                    {t('Total', 'মোট')}: {faraezTotal.toFixed(2)} {t('decimal', 'শতক')}
                  </p>
                </div>
                <div className="space-y-2">
                  {faraezShares.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-line-hair pb-2 text-sm last:border-0"
                    >
                      <div>
                        <span className="font-medium text-ink">
                          {lang === 'bn' ? s.relationBn : s.relation} &times; {s.count}
                        </span>
                        <span className="mono ml-2 text-2xs text-ink-3">{s.fraction}</span>
                      </div>
                      <div className="text-right">
                        <span className="mono font-semibold text-ink">
                          {s.totalDecimal} {t('decimal', 'শতক')}
                        </span>
                        <span className="mono ml-2 text-2xs text-ink-3">
                          ({s.perPersonDecimal} {t('dec each', 'শতক/জন')} &middot; {s.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="border border-line bg-ground-sunk p-4 text-center text-xs text-ink-3">
                Enter heir counts to preview distribution.
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Kharij & Partition Simulator */}
        {tab === 'kharij' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h4 className="text-sm font-semibold text-ink">
                  {t('Automated Kharij Partition & Subdivision', 'স্বয়ংক্রিয় জমা খারিজ ও দাগ বিভাজন নকশা')}
                </h4>
                <p className="text-xs text-ink-2">
                  ফারায়েজ বণ্টনের ভিত্তিতে মূল দাগকে উপ-দাগে (বাটা দাগ) বিভক্ত করে ডিজিটাল নামজারি খসড়া প্রস্তুত।
                </p>
              </div>
              <span className="mono text-xs font-semibold text-indigo">
                মূল দাগ ১২০৪ &middot; মোট জমি: {fArea || initialDecimal} শতক
              </span>
            </div>

            {/* Visual Cadastral Partition Canvas (SVG) */}
            <div className="border border-line bg-sheet-raised p-4">
              <span className="mono block text-2xs uppercase text-ink-3 mb-2">
                প্রস্তাবিত উপ-দাগের ভৌগোলিক নকশা (Simulated Cadastral Subdivision)
              </span>
              <div className="relative h-44 w-full rounded border border-line bg-ground-sunk overflow-hidden flex items-center justify-center p-2">
                <svg viewBox="0 0 600 160" className="h-full w-full">
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-line-hair" />
                    </pattern>
                  </defs>
                  <rect width="600" height="160" fill="url(#gridPattern)" />

                  {/* Subdivision polygon blocks */}
                  {/* Block 1: Wife 12.5% */}
                  <polygon
                    points="30,20 120,20 100,140 30,140"
                    fill="#116149"
                    fillOpacity="0.25"
                    stroke="#116149"
                    strokeWidth="1.5"
                  />
                  <text x="50" y="75" fill="#116149" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    দাগ ১২০৪/১
                  </text>
                  <text x="50" y="95" fill="#116149" fontSize="10" fontFamily="sans-serif">
                    স্ত্রী (০.৬৯ শতক)
                  </text>

                  {/* Block 2: Son 1 43.75% */}
                  <polygon
                    points="120,20 350,20 330,140 100,140"
                    fill="#22456e"
                    fillOpacity="0.25"
                    stroke="#22456e"
                    strokeWidth="1.5"
                  />
                  <text x="180" y="75" fill="#22456e" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    দাগ ১২০৪/২ (পুত্র ১)
                  </text>
                  <text x="180" y="95" fill="#22456e" fontSize="10" fontFamily="sans-serif">
                    ২.৪১ শতক (৪৩.৭৫%)
                  </text>

                  {/* Block 3: Son 2 43.75% */}
                  <polygon
                    points="350,20 570,20 570,140 330,140"
                    fill="#86adda"
                    fillOpacity="0.3"
                    stroke="#22456e"
                    strokeWidth="1.5"
                  />
                  <text x="410" y="75" fill="#22456e" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
                    দাগ ১২০৪/৩ (পুত্র ২)
                  </text>
                  <text x="410" y="95" fill="#22456e" fontSize="10" fontFamily="sans-serif">
                    ২.৪১ শতক (৪৩.৭৫%)
                  </text>

                  {/* Survey Station Pins */}
                  <circle cx="30" cy="20" r="3" fill="#a8322a" />
                  <circle cx="570" cy="20" r="3" fill="#a8322a" />
                  <circle cx="570" cy="140" r="3" fill="#a8322a" />
                  <circle cx="30" cy="140" r="3" fill="#a8322a" />
                </svg>
              </div>
            </div>

            {/* Proposed Kharij Holdings Register */}
            <div className="border border-line bg-sheet p-4 space-y-2">
              <span className="mono block text-2xs uppercase text-ink-3">
                খতিয়ান ও হোল্ডিং বিভাজন প্রস্তাবনা (Proposed Separate Holdings)
              </span>
              <div className="grid gap-2 sm:grid-cols-3 text-xs">
                <div className="rounded border border-line bg-sheet-raised p-2.5">
                  <span className="mono font-bold text-state">প্রস্তাবিত দাগ ১২০৪/১</span>
                  <p className="mt-1 text-ink font-semibold">ওয়ারিশ: স্ত্রী</p>
                  <p className="mono text-2xs text-ink-2">হিস্যা: ০.৬৯ শতক (০.৪২ কাঠা)</p>
                  <span className="mt-1 inline-block text-[10px] text-state">স্বতন্ত্র হোল্ডিং প্রস্তুত</span>
                </div>
                <div className="rounded border border-line bg-sheet-raised p-2.5">
                  <span className="mono font-bold text-indigo">প্রস্তাবিত দাগ ১২০৪/২</span>
                  <p className="mt-1 text-ink font-semibold">ওয়ারিশ: জ্যেষ্ঠ পুত্র</p>
                  <p className="mono text-2xs text-ink-2">হিস্যা: ২.৪১ শতক (১.৪৬ কাঠা)</p>
                  <span className="mt-1 inline-block text-[10px] text-indigo">স্বতন্ত্র হোল্ডিং প্রস্তুত</span>
                </div>
                <div className="rounded border border-line bg-sheet-raised p-2.5">
                  <span className="mono font-bold text-indigo">প্রস্তাবিত দাগ ১২০৪/৩</span>
                  <p className="mt-1 text-ink font-semibold">ওয়ারিশ: কনিষ্ঠ পুত্র</p>
                  <p className="mono text-2xs text-ink-2">হিস্যা: ২.৪১ শতক (১.৪৬ কাঠা)</p>
                  <span className="mt-1 inline-block text-[10px] text-indigo">স্বতন্ত্র হোল্ডিং প্রস্তুত</span>
                </div>
              </div>
            </div>

            {/* 1-Click e-Mutation Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border border-indigo/20 bg-indigo-soft p-4">
              <div>
                <span className="text-xs font-semibold text-indigo block">
                  অনলাইন ই-নামজারি খারিজ আবেদন (1-Click e-Mutation Kharij)
                </span>
                <p className="text-2xs text-ink-2 mt-0.5">
                  উক্ত ফারায়েজ ও বাটা দাগের ভিত্তিতে এসিল্যান্ড আদালতে তাৎক্ষণিক খারিজ কেস রেজিস্ট্রি করুন।
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setDraftedMutation(`MUT-KHARIJ-${Math.floor(1000 + Math.random() * 9000)}-2026`);
                }}
              >
                ই-নামজারি আবেদন ড্রাফট করুন
              </Button>
            </div>

            {draftedMutation && (
              <div className="rounded border border-state/40 bg-state-soft p-3.5 text-xs text-state">
                <div className="flex items-center gap-2">
                  <span className="font-bold">✓ আবেদন ড্রাফট সফল হয়েছে: </span>
                  <span className="mono font-bold">{draftedMutation}</span>
                </div>
                <p className="mt-1 text-2xs text-ink-2">
                  আইনি ডিসিআর ফি: ১,১৫০ টাকা। সহকারী কমিশনার (ভূমি) এর বিচারিক ট্র্যাকিং প্যানেলে নথিটি সংযুক্ত হয়েছে।
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tax Estimator */}
        {tab === 'tax' && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Land Class (শ্রেণি)" htmlFor="tclass">
                <select
                  id="tclass"
                  value={tClass}
                  onChange={(e) => setTClass(e.target.value)}
                  className={inputClass}
                >
                  <option value="Homestead — বাস্তুভিটা">Residential (বাস্তুভিটা / আবাসিক) — ৳50/dec</option>
                  <option value="Commercial — বাণিজ্যিক">Commercial (বাণিজ্যিক) — ৳400/dec</option>
                  <option value="Industrial — শিল্প">Industrial (শিল্প এলাকা) — ৳300/dec</option>
                  <option value="Agricultural — কৃষি">Agricultural (কৃষি / নাল) — ৳5/dec</option>
                </select>
              </Field>
              <Field label="Parcel Area in Decimal (জমির পরিমাণ)" htmlFor="tarea">
                <input
                  id="tarea"
                  type="number"
                  step="any"
                  value={tArea}
                  onChange={(e) => setTArea(parseFloat(e.target.value) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
            </div>

            <div className="border border-line bg-sheet-raised p-5">
              <p className="mono text-2xs uppercase text-ink-3">Estimated Annual Demand (বাৎসরিক কর দাবি)</p>
              <p className="mono tnum mt-2 text-3xl font-semibold text-ink">{taka(estimatedTax)}</p>
              <p className="bn mt-1 text-xs text-ink-3">
                ভূমি উন্নয়ন কর অধ্যাদেশ ও সরকার নির্ধারিত তফসিল অনুযায়ী আনুমানিক কর হিসাব।
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Close Tool
          </Button>
        </div>
      </div>
    </Modal>
  );
}
