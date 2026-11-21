"use client";

import { useEffect, useRef, useState } from "react";
import { cn, inr } from "@/lib/format";

/* ── Animated currency ───────────────────────────────────────────────── */

export function useCountUp(target: number, duration = 620) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef<number>();

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    const delta = target - origin;
    if (delta === 0) return;

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(origin + delta * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      from.current = target;
    };
  }, [target, duration]);

  return value;
}

export function Money({
  value,
  className,
  animate = true,
  symbol = true,
}: {
  value: number;
  className?: string;
  animate?: boolean;
  symbol?: boolean;
}) {
  const animated = useCountUp(animate ? value : 0);
  const shown = animate ? animated : value;
  return (
    <span className={cn("tnum font-mono", className)}>
      {symbol && <span className="mr-[0.06em] opacity-55">₹</span>}
      {Math.round(shown).toLocaleString("en-IN")}
    </span>
  );
}

/* ── Small primitives ────────────────────────────────────────────────── */

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("label", className)}>{children}</div>;
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "emerald" | "vermilion" | "amber";
  className?: string;
}) {
  const tones = {
    neutral: "border-rule text-ink-2 bg-paper",
    emerald: "border-emerald/25 text-emerald bg-emerald-50",
    vermilion: "border-vermilion/30 text-vermilion-700 bg-vermilion-50",
    amber: "border-amber/25 text-amber bg-amber-50",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border px-2 py-[3px] text-[10.5px] font-medium uppercase tracking-label",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const variants = {
    primary:
      "bg-emerald text-ivory border-emerald hover:bg-emerald-700 active:translate-y-px",
    outline:
      "bg-paper text-ink border-rule-strong hover:border-emerald hover:text-emerald",
    ghost: "bg-transparent text-ink-2 border-transparent hover:text-ink",
    danger: "bg-vermilion text-white border-vermilion hover:bg-vermilion-700",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center gap-2 border px-4 text-[13px] font-medium tracking-[0.01em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] w-full items-center justify-between gap-4 py-2 text-left"
    >
      <span>
        <span className="block text-[13.5px] font-medium text-ink">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-2">
            {hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "relative flex h-[26px] w-[46px] shrink-0 items-center rounded-full border transition-colors",
          checked
            ? "border-emerald bg-emerald"
            : "border-rule-strong bg-ivory",
        )}
      >
        <span
          className={cn(
            "absolute h-[20px] w-[20px] rounded-full bg-paper transition-transform",
            checked
              ? "translate-x-[23px] border border-emerald"
              : "translate-x-[2px] border border-rule-strong",
          )}
        />
      </span>
    </button>
  );
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step,
  label,
  display,
  disabled,
  note,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  label: string;
  display: string;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <div className={cn(disabled && "opacity-45")}>
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        <div className="font-mono text-[13px] tnum text-ink">{display}</div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full"
      />
      {note && <p className="mt-0.5 text-[11px] leading-snug text-ink-3">{note}</p>}
    </div>
  );
}

export function SectionHead({
  index,
  title,
  right,
}: {
  index: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <span className="font-mono text-[10px] tnum text-ink-2">{index}</span>
        <h2 className="font-serif text-[19px] leading-none text-ink">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/** A hairline rule that terminates in a small emerald tick. */
export function Rule() {
  return <div className="ledger-rule my-5" aria-hidden />;
}

export const CATEGORY_COLOR: Record<string, string> = {
  room: "#0F5132",
  surgeon: "#14663F",
  ot: "#1E7A4C",
  nursing: "#4A7C5D",
  pharmacy: "#B45309",
  implant: "#A81B1B",
  consumable: "#8A6A3B",
  diagnostic: "#5B6472",
  misc: "#8A909C",
};