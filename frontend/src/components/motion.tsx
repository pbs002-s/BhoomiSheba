import React, { useEffect, useRef, useState } from 'react';
import { cx } from '../lib/format';
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap';

const reduced = prefersReducedMotion;

/* ------------------------------------------------------------------
   Reveal — enters once, on scroll. Never re-animates; content that
   re-animates on every pass is noise, not emphasis.
   ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (reduced()) return setShown(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cx(className, shown && 'anim-sheet-in')}
      style={{ opacity: shown ? undefined : 0, animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------
   Lines — the headline treatment. Each line sits in a clipped band and
   rises out of it, staggered, like a sheet being drawn from a drawer.
   Lines are authored explicitly so the break points are a design
   decision rather than whatever the viewport happens to do.
   ------------------------------------------------------------------ */
export function Lines({
  lines,
  className,
  lineClassName,
  stagger = 70,
  delay = 0,
  onScroll: revealOnScroll = false,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  stagger?: number;
  delay?: number;
  onScroll?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [go, setGo] = useState(!revealOnScroll);

  useEffect(() => {
    if (!revealOnScroll) return;
    if (reduced()) return setGo(true);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setGo(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [revealOnScroll]);

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <span
            className={cx('block', lineClassName, go && 'anim-line-rise')}
            style={{ opacity: go ? undefined : 0, animationDelay: `${delay + i * stagger}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   Counter — a register rolling to its value. Tabular numerals so the
   layout doesn't shiver while it counts.
   ------------------------------------------------------------------ */
export function Counter({
  to,
  duration = 900,
  decimals: dp = 0,
  prefix = '',
  suffix = '',
  className,
}: {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(reduced() ? to : 0);

  useEffect(() => {
    if (reduced()) return setValue(to);
    const el = ref.current;
    if (!el) return;
    let tween: gsap.core.Tween | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const counter = { val: 0 };
        tween = gsap.to(counter, {
          val: to,
          duration: duration / 1000,
          ease: 'power3.out',
          onUpdate: () => setValue(counter.val),
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [to, duration]);

  return (
    <span ref={ref} className={cx('tnum', className)}>
      {prefix}
      {value.toLocaleString('en-BD', { minimumFractionDigits: dp, maximumFractionDigits: dp })}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------
   Stagger — entrance for record cards, table rows and timeline items.
   Animates its own direct children with a GSAP stagger each time
   `watch` changes (e.g. a parcel switch or a new record arriving).
   ------------------------------------------------------------------ */
export function Stagger({
  children,
  className,
  as: Tag = 'div',
  watch,
  y = 10,
  amount = 0.4,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  watch?: unknown;
  y?: number;
  amount?: number;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced()) return;
      const items = Array.from(el.children);
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06, overwrite: true }
      );
    },
    { dependencies: [watch, React.Children.count(children)], scope: ref as React.RefObject<HTMLElement> }
  );

  return (
    <Tag ref={ref as never} className={className}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------
   TypedId — a Parcel ID entered the way it is in a field book:
   character by character, with a caret. Used once, in the hero.
   ------------------------------------------------------------------ */
export function TypedId({ value, className, speed = 55 }: { value: string; className?: string; speed?: number }) {
  const [n, setN] = useState(reduced() ? value.length : 0);

  useEffect(() => {
    if (reduced()) return;
    setN(0);
    const id = setInterval(() => {
      setN((prev) => {
        if (prev >= value.length) {
          clearInterval(id);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [value, speed]);

  return (
    <span className={cx('mono tabular-nums', className)} aria-label={value}>
      <span aria-hidden>{value.slice(0, n)}</span>
      {n < value.length && (
        <span aria-hidden className="anim-caret text-indigo">
          ▍
        </span>
      )}
    </span>
  );
}
