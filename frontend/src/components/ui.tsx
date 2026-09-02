import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cx } from '../lib/format';
import type { Theme } from '../lib/theme';

/* --------------------------------------------------------------- Panel ---
   Every panel carries a title block, the way every survey sheet does:
   what this is on the left, which record it came from on the right.
--------------------------------------------------------------------- */
export function Panel({
  label,
  meta,
  children,
  className,
  bodyClassName,
  action,
}: {
  label?: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={cx('reg-mark relative border border-line bg-sheet rounded-lg', className)}>
      {(label || meta || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 sm:px-5">
          <span className="mono text-2xs uppercase text-ink-3">{label}</span>
          <span className="flex items-center gap-3">
            {meta && <span className="mono text-2xs text-ink-3">{meta}</span>}
            {action}
          </span>
        </header>
      )}
      <div className={cx('px-4 py-4 sm:px-5 sm:py-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/* -------------------------------------------------------------- Button --- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'seal';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'secondary', size = 'md', className, children, ...rest }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors duration-1 ease-sheet disabled:cursor-not-allowed disabled:opacity-45';
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm' }[size];
  const variants = {
    primary: 'border-indigo bg-indigo text-sheet-raised hover:bg-indigo-ink hover:border-indigo-ink',
    secondary: 'border-line bg-sheet-raised text-ink hover:border-ink-3 hover:bg-ground-sunk',
    quiet: 'border-transparent bg-transparent text-ink-2 hover:text-ink hover:bg-ground-sunk',
    seal: 'border-seal bg-seal text-sheet-raised hover:opacity-90',
  }[variant];
  return (
    <button className={cx(base, sizes, variants, className)} {...rest}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------- StatusMark ---
   A square tag with a colour rule, not a pill. Colour is load-bearing:
   green = confirmed by a record, amber = in progress, red = you owe or
   someone objected, indigo = informational.
--------------------------------------------------------------------- */
export type Tone = 'state' | 'amber' | 'seal' | 'indigo' | 'neutral';

const toneMap: Record<Tone, { text: string; bg: string; border: string }> = {
  state: { text: 'text-state', bg: 'bg-state-soft', border: 'border-state' },
  amber: { text: 'text-amber', bg: 'bg-amber-soft', border: 'border-amber' },
  seal: { text: 'text-seal', bg: 'bg-seal-soft', border: 'border-seal' },
  indigo: { text: 'text-indigo', bg: 'bg-indigo-soft', border: 'border-indigo' },
  neutral: { text: 'text-ink-2', bg: 'bg-ground-sunk', border: 'border-line-strong' },
};

export function StatusMark({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  const t = toneMap[tone];
  return (
    <span
      className={cx(
        'mono inline-flex items-center gap-1.5 rounded-sm border-l-2 px-2 py-0.5 text-2xs uppercase',
        t.text,
        t.bg,
        t.border
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------- DataRow ---
   A register line: label left, value right, hairline between.
--------------------------------------------------------------------- */
export function DataRow({
  label,
  bn,
  value,
  mono = false,
}: {
  label: string;
  bn?: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line-hair py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-ink-3">
        {bn ? (
          <>
            <span className="lang-en">{label}</span>
            <span className="lang-bn">{bn}</span>
          </>
        ) : (
          label
        )}
      </span>
      <span className={cx('text-right text-sm text-ink', mono && 'mono tnum text-[13px]')}>{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------- Eyebrow ---- */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cx('mono text-2xs uppercase text-ink-3', className)}>{children}</p>;
}

/* --------------------------------------------------------------- Field --- */
export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label className="block space-y-1.5" htmlFor={htmlFor}>
      <span className="block text-sm text-ink-2">{label}</span>
      {children}
      {hint && <span className="block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-md border border-line bg-sheet-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 outline-none transition-colors duration-1 focus:border-indigo';

/* -------------------------------------------------------- ThemeToggle --- */
export function ThemeToggle({
  theme,
  onToggle,
  className,
}: {
  theme: Theme;
  onToggle: () => void;
  className?: string;
}) {
  const next = theme === 'dark' ? 'day sheet' : 'night sheet';
  return (
    <button
      onClick={onToggle}
      aria-label={`Switch to ${next}`}
      title={`Switch to ${next}`}
      className={cx(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-sheet-raised text-ink-2 transition-colors duration-1 hover:border-ink-3 hover:text-ink',
        className
      )}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

/* ----------------------------------------------------- LanguageToggle --- */
export function LanguageToggle({
  lang,
  onToggle,
  className,
}: {
  lang: 'en' | 'bn';
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      aria-label={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
      title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
      className={cx(
        'inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-sheet-raised px-2.5 text-xs font-semibold text-ink-2 transition-colors duration-1 hover:border-indigo hover:text-indigo',
        className
      )}
    >
      <span className={cx('text-[13px]', lang === 'bn' ? 'font-bold text-indigo' : 'text-ink-3')}>বাং</span>
      <span className="text-ink-3">/</span>
      <span className={cx('font-mono text-[11px]', lang === 'en' ? 'font-bold text-indigo' : 'text-ink-3')}>EN</span>
    </button>
  );
}
