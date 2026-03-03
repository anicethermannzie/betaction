'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Requirement {
  label: string;
  met:   boolean;
}

type StrengthLevel = 'weak' | 'medium' | 'strong';

function assess(password: string): { score: number; level: StrengthLevel; reqs: Requirement[] } {
  const reqs: Requirement[] = [
    { label: 'At least 8 characters',       met: password.length >= 8              },
    { label: 'Contains a number',            met: /\d/.test(password)               },
    { label: 'Contains a special character', met: /[^a-zA-Z0-9]/.test(password)    },
    { label: 'Contains an uppercase letter', met: /[A-Z]/.test(password)            },
  ];

  const score = reqs.filter((r) => r.met).length;
  const level: StrengthLevel =
    score >= 4 ? 'strong' :
    score >= 2 ? 'medium' :
    'weak';

  return { score, level, reqs };
}

interface PasswordStrengthProps {
  password:   string;
  className?: string;
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, level, reqs } = assess(password);

  const barColor =
    level === 'strong' ? 'bg-emerald-500' :
    level === 'medium' ? 'bg-amber-500'   :
    'bg-red-500';

  const levelColor =
    level === 'strong' ? 'text-emerald-400' :
    level === 'medium' ? 'text-amber-400'   :
    'text-red-400';

  const levelLabel =
    level === 'strong' ? 'Strong' :
    level === 'medium' ? 'Medium' :
    'Weak';

  return (
    <div className={cn('space-y-2.5 mt-2', className)}>
      {/* Strength bar + label */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-0.5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                n <= score ? barColor : 'bg-muted/40'
              )}
            />
          ))}
        </div>
        <span className={cn('text-[11px] font-semibold shrink-0 w-12 text-right', levelColor)}>
          {levelLabel}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1">
        {reqs.map((req) => (
          <div key={req.label} className="flex items-center gap-1.5">
            {req.met
              ? <Check className="h-3 w-3 text-emerald-400 shrink-0" />
              : <X     className="h-3 w-3 text-muted-foreground/30 shrink-0" />
            }
            <span className={cn(
              'text-[11px] leading-tight',
              req.met ? 'text-foreground/65' : 'text-muted-foreground/45'
            )}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
