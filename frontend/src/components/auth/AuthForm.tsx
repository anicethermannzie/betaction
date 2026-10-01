'use client';

import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/common/BrandLogo';

// ── Brand logo ─────────────────────────────────────────────────────────────

export function MatchWiseLogo({ className }: { className?: string }) {
  return <BrandLogo className={cn('text-primary', className)} />;
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
    <div className="relative isolate flex min-h-[calc(100dvh-56px)] items-center overflow-hidden bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/30 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden border-r border-border lg:block">
          <img src="/images/matchwise-human-hero.png" alt="Football fan using MatchWise analysis on a phone and laptop" className="absolute inset-0 h-full w-full object-cover object-[58%_center] opacity-55" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--card)/.98)_0%,hsl(var(--card)/.7)_48%,transparent_100%),linear-gradient(0deg,hsl(var(--card)/.96),transparent_65%)]" />
          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div><MatchWiseLogo /><p className="mt-14 font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Football intelligence / 01</p><h2 className="mt-5 max-w-md font-display text-5xl font-semibold leading-[0.98] tracking-[-0.045em]">Understand<br /><span className="text-primary">the match.</span></h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">Model probabilities, team context, and match signals in one clear workspace.</p></div>
            <div className="grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border"><div className="bg-background/80 p-3"><span className="label">Context</span><div className="mt-2 text-xs text-foreground/80">Form + H2H</div></div><div className="bg-background/80 p-3"><span className="label">Model</span><div className="mt-2 text-xs text-foreground/80">Probability</div></div><div className="bg-background/80 p-3"><span className="label">Signal</span><div className="mt-2 text-xs text-primary">Explainable</div></div></div>
          </div>
        </div>
        <div className={cn('flex items-center p-6 sm:p-10 lg:p-14', className)}>
          <div className="w-full max-w-[420px]">
            <div className="mb-8 lg:hidden"><MatchWiseLogo /></div>
            <div className="mb-8"><p className="label text-primary">MatchWise access</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p></div>
            {children}
            <p className="mt-8 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50">Statistical analysis only · no prediction is guaranteed</p>
          </div>
        </div>
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
        'outline-none transition-colors duration-150',
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


