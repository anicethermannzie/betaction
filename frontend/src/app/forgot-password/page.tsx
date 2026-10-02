'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { AuthForm, AuthInput, Field, OrDivider, ErrorAlert, SuccessAlert } from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const { forgotPassword, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await forgotPassword(email);
      // The endpoint always responds the same way regardless of whether the
      // email exists (see passwordResetController) — this success state is
      // shown identically either way, on purpose.
      setSent(true);
    } catch {
      // The store supplies the server error directly.
    }
  };

  return (
    <AuthForm
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset link."
    >
      {sent ? (
        <SuccessAlert message="If that email is registered, a password reset link has been sent. Check your inbox." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="Email" htmlFor="email">
            <AuthInput
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Field>

          {error && <ErrorAlert message={error} />}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary text-foreground font-semibold h-10"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              'Send reset link'
            )}
          </Button>
        </form>
      )}

      <OrDivider />

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/login" className="text-primary hover:text-primary font-semibold hover:underline transition-colors">
          Sign In
        </Link>
      </p>
    </AuthForm>
  );
}
