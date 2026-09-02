import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'bn';

const STORAGE_KEY = 'bhumi.lang';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (enText: string, bnText: string) => string;
  pickLang: (text: string | null | undefined) => string;
  formatKatha: (areaDecimal: number) => string;
  formatBigha: (areaDecimal: number) => string;
  formatArea: (areaDecimal: number) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (enText) => enText,
  pickLang: (text) => text || '',
  formatKatha: (d) => `${(d / 1.65).toFixed(2)} katha`,
  formatBigha: (d) => `${(d / 33.0).toFixed(2)} bigha`,
  formatArea: (d) => `${d.toFixed(2)} decimal`,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'bn') return saved;
    } catch {
      // storage blocked
    }
    return 'bn'; // Default to Bangla
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.setAttribute('data-lang', lang);
      document.documentElement.setAttribute('lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'en' ? 'bn' : 'en'));
  }, []);

  const t = useCallback(
    (enText: string, bnText: string) => {
      return lang === 'bn' ? bnText : enText;
    },
    [lang]
  );

  /**
   * Cleans bilingual strings formatted like "Homestead — বাস্তুভিটা" or "Md. Rafiqul Islam — মোঃ রফিকুল ইসলাম"
   * to show strictly ONE language depending on the active mood.
   */
  const pickLang = useCallback(
    (text: string | null | undefined) => {
      if (!text) return '';
      if (text.includes(' — ')) {
        const parts = text.split(' — ');
        return lang === 'bn' ? parts[parts.length - 1].trim() : parts[0].trim();
      }
      if (text.includes(' · ') && (text.includes('কাঠা') || text.includes('বিঘা'))) {
        // e.g. "3.33 কাঠা (3.33 katha)"
        const parts = text.split(' · ');
        return parts.map((p) => {
          const match = p.match(/(.*?)\((.*?)\)/);
          if (match) {
            return lang === 'bn' ? match[1].trim() : match[2].trim();
          }
          return p;
        }).join(' · ');
      }
      return text;
    },
    [lang]
  );

  const formatKatha = useCallback(
    (areaDecimal: number) => {
      const k = (areaDecimal / 1.65).toFixed(2);
      return lang === 'bn' ? `${k} কাঠা` : `${k} katha`;
    },
    [lang]
  );

  const formatBigha = useCallback(
    (areaDecimal: number) => {
      const b = (areaDecimal / 33.0).toFixed(2);
      return lang === 'bn' ? `${b} বিঘা` : `${b} bigha`;
    },
    [lang]
  );

  const formatArea = useCallback(
    (areaDecimal: number) => {
      return lang === 'bn' ? `${areaDecimal.toFixed(2)} শতক` : `${areaDecimal.toFixed(2)} decimal`;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t,
        pickLang,
        formatKatha,
        formatBigha,
        formatArea,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
