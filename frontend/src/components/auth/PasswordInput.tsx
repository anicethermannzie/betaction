'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
}

export function PasswordInput({ className, error, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        className={cn(
          'w-full rounded-lg border px-3.5 py-2.5 text-sm',
          'bg-slate-800/70 text-foreground placeholder:text-muted-foreground/45',
          'outline-none transition-all duration-150',
          'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15',
          error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/15',
          'pr-10',
          className
        )}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
