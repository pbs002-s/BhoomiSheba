import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Button, Field, inputClass, DataRow } from './ui';
import { convertLandUnits, calculateFaraez } from '../lib/api';
import type { LandUnits, FaraezShare } from '../lib/types';
import { taka } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  initialDecimal?: number;
}

type TabType = 'convert' | 'faraez' | 'tax';

export default function LandCalculatorModal({ open, onClose, initialDecimal = 5.5 }: Props) {
  const [tab, setTab] = useState<TabType>('convert');

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

  // Run conversion whenever val or unit changes
  useEffect(() => {
    convertLandUnits(val || 0, unit).then(setConverted);
  }, [val, unit]);

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
    if (tab === 'faraez') handleFaraez();
  }, [tab, fArea, sons, daughters, wife, husband, father, mother]);

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
        <div className="grid grid-cols-3 gap-px border border-line bg-line">
          {[
            { id: 'convert' as const, en: 'Unit Converter', bn: 'পরিমাপ রূপান্তর' },
            { id: 'faraez' as const, en: 'Faraez Inheritance', bn: 'ফারায়েজ বণ্টন' },
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
              <Field label="Input Value (পরিমাণ)" htmlFor="cval">
                <input
                  id="cval"
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e) => setVal(parseFloat(e.target.value) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label="From Unit (একক)" htmlFor="cunit">
                <select
                  id="cunit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="decimal">শতক / ডেসিমেল (Decimal)</option>
                  <option value="katha">কাঠা (Katha — 1.65 Dec)</option>
                  <option value="bigha">বিঘা (Bigha — 33 Dec / 20 Katha)</option>
                  <option value="acre">একর (Acre — 100 Dec)</option>
                  <option value="sqft">বর্গফুট (Square Feet)</option>
                  <option value="sqm">বর্গমিটার (Square Metre)</option>
                </select>
              </Field>
            </div>

            {converted && (
              <div className="border border-line bg-sheet-raised p-4">
                <p className="mono mb-3 text-2xs uppercase text-ink-3">Standard Bangladesh Conversions (DLRS)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <DataRow label="শতক / ডেসিমেল (Decimal)" value={`${converted.decimal} dec`} mono />
                  <DataRow label="কাঠা (Katha)" value={`${converted.katha} katha`} mono />
                  <DataRow label="বিঘা (Bigha)" value={`${converted.bigha} bigha`} mono />
                  <DataRow label="একর (Acre)" value={`${converted.acre} acre`} mono />
                  <DataRow label="বর্গফুট (Sq Feet)" value={`${converted.squareFeet.toLocaleString()} sq ft`} mono />
                  <DataRow label="বর্গমিটার (Sq Metre)" value={`${converted.squareMetres.toLocaleString()} sq m`} mono />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Faraez Inheritance Calculator */}
        {tab === 'faraez' && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Total Land (মোট জমি শতকে)" htmlFor="farea">
                <input
                  id="farea"
                  type="number"
                  step="any"
                  value={fArea}
                  onChange={(e) => setFArea(parseFloat(e.target.value) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label="Sons (পুত্র)" htmlFor="fsons">
                <input
                  id="fsons"
                  type="number"
                  min="0"
                  value={sons}
                  onChange={(e) => setSons(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label="Daughters (কন্যা)" htmlFor="fdaughters">
                <input
                  id="fdaughters"
                  type="number"
                  min="0"
                  value={daughters}
                  onChange={(e) => setDaughters(parseInt(e.target.value, 10) || 0)}
                  className={`${inputClass} mono tnum`}
                />
              </Field>
              <Field label="Wife (স্ত্রী)" htmlFor="fwife">
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
              <Field label="Husband (স্বামী)" htmlFor="fhus">
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
              <Field label="Father (পিতা)" htmlFor="ffather">
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
              <Field label="Mother (মাতা)" htmlFor="fmother">
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
                  <p className="mono text-2xs uppercase text-ink-3">Inheritance Distribution (ওয়ারিশ বণ্টন)</p>
                  <p className="mono text-xs text-indigo">Total: {faraezTotal.toFixed(2)} decimal</p>
                </div>
                <div className="space-y-2">
                  {faraezShares.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-line-hair pb-2 text-sm last:border-0"
                    >
                      <div>
                        <span className="font-medium text-ink">
                          {s.relation} ({s.relationBn}) × {s.count}
                        </span>
                        <span className="mono ml-2 text-2xs text-ink-3">{s.fraction}</span>
                      </div>
                      <div className="text-right">
                        <span className="mono font-semibold text-ink">{s.totalDecimal} decimal</span>
                        <span className="mono ml-2 text-2xs text-ink-3">
                          ({s.perPersonDecimal} dec each · {s.percentage}%)
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

        {/* Tab 3: Tax Estimator */}
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
