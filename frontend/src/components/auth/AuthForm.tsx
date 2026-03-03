'use client';

import { cn } from '@/lib/utils';

// ── BetAction logo ─────────────────────────────────────────────────────────

export function BetActionLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-0.5', className)}>
      <span className="text-2xl font-black tracking-tight">
        <span className="text-emerald-400">Bet</span>
        <span className="text-foreground">Action</span>
      </span>
    </div>
  );
}

// ── Shared form wrapper ────────────────────────────────────────────────────

interface AuthFormProps {
  title:      string;
  subtitle:   string;
  children:   React.ReactNode;
  className?: string;
}

export function AuthForm({ title, subtitle, children, className }: AuthFormProps) {
  return (
    <div
      className="flex min-h-[calc(100vh-56px)] items-center justify-center p-4"
      style={{
        background:
          'radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.07) 0%, transparent 65%)',
      }}
    >
      <div
        className={cn(
          'w-full max-w-[420px]',
          'rounded-2xl border border-slate-800/80',
          'bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-sm',
          'p-7 sm:p-8',
          className
        )}
      >
        {/* Logo */}
        <BetActionLogo className="mb-6" />

        {/* Heading */}
        <div className="text-center mb-7">
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

// ── Input field wrapper (label + input + optional error) ──────────────────

interface FieldProps {
  label:      string;
  htmlFor:    string;
  error?:     string;
  children:   React.ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-foreground/80 uppercase tracking-wide"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-400">{error}</p>
      )}
    </div>
  );
}

// ── Styled base input ──────────────────────────────────────────────────────

export function AuthInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, className, ...rest } = props;
  return (
    <input
      className={cn(
        'w-full rounded-lg border px-3.5 py-2.5 text-sm',
        'bg-slate-800/70 text-foreground placeholder:text-muted-foreground/45',
        'outline-none transition-all duration-150',
        'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15',
        error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/15',
        className
      )}
      {...rest}
    />
  );
}

// ── "or" divider ──────────────────────────────────────────────────────────

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

// ── Error alert ───────────────────────────────────────────────────────────

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}

// ── Success alert ─────────────────────────────────────────────────────────

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
      {message}
    </div>
  );
}
