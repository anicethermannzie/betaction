'use client';

import { cn } from '@/lib/utils';

// ── BetAction logo ─────────────────────────────────────────────────────────

export function BetActionLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-0.5', className)}>
      <span className="text-2xl font-bold tracking-tight">
        <span className="text-primary">Bet</span>
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
          'rounded-lg border border-border',
          'bg-card   ',
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
        <p className="text-[11px] text-down">{error}</p>
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
        'bg-muted text-foreground placeholder:text-muted-foreground/45',
        'outline-none transition-all duration-150',
        'border-border focus:border-primary focus:ring-2 focus:ring-primary/15',
        error && 'border-down/70 focus:border-down focus:ring-down/15',
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
      <div className="flex-1 h-px bg-muted" />
      <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">or</span>
      <div className="flex-1 h-px bg-muted" />
    </div>
  );
}

// ── Error alert ───────────────────────────────────────────────────────────

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-down/25 bg-down/10 px-4 py-3 text-sm text-down">
      {message}
    </div>
  );
}

// ── Success alert ─────────────────────────────────────────────────────────

export function SuccessAlert({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-primary">
      {message}
    </div>
  );
}
