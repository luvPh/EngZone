"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent grid place-items-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface border border-border rounded-2xl p-4 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-slate-300 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full bg-surface-2 border border-border rounded-xl px-3.5 py-2.5 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition";

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
      ? "bg-gradient-to-r from-accent to-accent-soft text-white hover:brightness-110 shadow-lg shadow-accent/20"
      : "bg-white/5 hover:bg-white/10 text-slate-200 border border-border";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition disabled:opacity-50 disabled:cursor-default disabled:shadow-none ${styles} ${props.className ?? ""}`}
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
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-slate-300">Độ khó</span>
        <span className="text-accent font-semibold">Level {value} / 5</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

/** Pill-style single-select. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl bg-surface-2 border border-border p-1 gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${
            value === o.value
              ? "bg-accent text-white"
              : "text-muted hover:text-white"
          }`}
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
