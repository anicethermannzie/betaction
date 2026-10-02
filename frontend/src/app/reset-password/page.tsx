'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useHydrated } from '@/hooks/useHydrated';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm, Field, OrDivider, ErrorAlert } from '@/components/auth/AuthForm';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const { resetPassword, isLoading, error, clearError } = useAuth();
  const hydrated = useHydrated();
  const token = hydrated ? new URLSearchParams(window.location.search).get('token') : null;

  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    clearError();

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPass) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (!token) {
      setSubmitError('This reset link is missing its token. Request a new one.');
      return;
    }

    try {
      await resetPassword(token, password);
    } catch {
      // The store supplies the server error directly.
    }
  };

  return (
    <AuthForm
      title="Choose a new password"
      subtitle="This also signs you out everywhere else, in case someone other than you had access."
    >
      {hydrated && !token ? (
        <ErrorAlert message="This reset link is missing its token. Request a new one from the forgot-password page." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Field label="New Password" htmlFor="password">
            <PasswordInput
              id="password"
              placeholder="Min 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <PasswordStrength password={password} />
          </Field>

          <Field
            label="Confirm New Password"
            htmlFor="confirm-password"
            error={confirmPass && password !== confirmPass ? 'Passwords do not match' : undefined}
          >
            <PasswordInput
              id="confirm-password"
              placeholder="Repeat your new password"
              autoComplete="new-password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
              error={!!(confirmPass && password !== confirmPass)}
            />
          </Field>

          {(submitError || error) && <ErrorAlert message={submitError || error || ''} />}

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary text-foreground font-semibold h-10"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting…
              </>
            ) : (
              'Reset password'
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
