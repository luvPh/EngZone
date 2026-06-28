"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  right,
  onBack,
}: {
  title: string;
  subtitle?: string;
  /** Small uppercase coral label above the title (Claude Design eyebrow). */
  eyebrow?: string;
  icon?: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
}) {
  return (
    <header className="mb-7 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="w-10 h-10 rounded-full glass-input text-fg hover:text-accent grid place-items-center shrink-0 transition mt-1"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="min-w-0">
          {(eyebrow || icon) && (
            <div className="flex items-center gap-2 mb-2.5 text-[13px] font-semibold uppercase tracking-[.04em] text-accent">
              {icon}
              {eyebrow ?? title}
            </div>
          )}
          <h1 className="font-display text-[34px] leading-[1.12] font-medium tracking-[-0.02em] text-fg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted text-base mt-2 max-w-[50ch] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

export function Card({
  children,
  className = "",
  variant = "glass",
}: {
  children: ReactNode;
  className?: string;
  variant?: "glass" | "reading";
}) {
  const surface = variant === "reading" ? "reading-surface" : "glass";
  return (
    <div className={`${surface} rounded-card p-5 ${className}`}>{children}</div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-[13px] font-semibold text-fg mb-2">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full glass-input rounded-[11px] px-3.5 py-2.5 text-base text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition placeholder:text-faint";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${inputBase} resize-y ${props.className ?? ""}`} />
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "bg-accent text-white hover:brightness-105 shadow-glow-accent"
      : "glass-input text-fg hover:border-accent";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[11px] px-[22px] py-[11px] font-semibold transition disabled:opacity-50 disabled:cursor-default disabled:shadow-none ${styles} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function LevelSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - 1) / 4) * 100;
  return (
    <div>
      <div className="flex justify-between text-[13px] mb-2">
        <span className="font-semibold text-fg">Độ khó</span>
        <span className="text-accent font-semibold">Level {value} / 5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--accent-weak) ${pct}%)`,
        }}
      />
    </div>
  );
}

/** Pill-style single-select. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  fullWidth = false,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`rounded-[11px] glass-input p-1 gap-1 ${
        fullWidth ? "flex w-full" : "inline-flex max-w-full flex-wrap"
      }`}
    >
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
            fullWidth ? "flex-1" : ""
          }`}
          style={
            value === o.value
              ? { background: "var(--accent)", color: "#fff" }
              : { background: "transparent", color: "var(--muted)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin ${className}`}
    />
  );
}

export function ProgressBar({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div
      className={`h-[7px] rounded-full overflow-hidden ${className}`}
      style={{ background: "var(--accent-weak)" }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          background: "linear-gradient(90deg, var(--accent-soft), var(--accent))",
        }}
      />
    </div>
  );
}
