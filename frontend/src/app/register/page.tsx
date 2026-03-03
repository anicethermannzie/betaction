'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { AuthForm, AuthInput, Field, OrDivider, ErrorAlert } from '@/components/auth/AuthForm';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { PasswordStrength } from '@/components/auth/PasswordStrength';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const { register, isLoading, error, clearError } = useAuth();

  const [username,     setUsername]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPass,  setConfirmPass]  = useState('');
  const [agreedTerms,  setAgreedTerms]  = useState(false);
  const [submitError,  setSubmitError]  = useState('');

  // Sync store error → local display
  useEffect(() => {
    if (error) setSubmitError(error);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    clearError();

    // Client-side validation
    if (username.trim().length < 3) {
      setSubmitError('Username must be at least 3 characters.');
      return;
    }
    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPass) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (!agreedTerms) {
      setSubmitError('You must agree to the Terms of Service.');
      return;
    }

    try {
      await register(username.trim(), email, password);
    } catch {
      // error is already in store / submitError via useEffect
    }
  };

  return (
    <AuthForm
      title="Create Account"
      subtitle="Join BetAction for free predictions"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <Field label="Username" htmlFor="username">
          <AuthInput
            id="username"
            type="text"
            placeholder="johndoe"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
          />
        </Field>

        {/* Email */}
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

        {/* Password + strength */}
        <Field label="Password" htmlFor="password">
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

        {/* Confirm password */}
        <Field
          label="Confirm Password"
          htmlFor="confirm-password"
          error={confirmPass && password !== confirmPass ? 'Passwords do not match' : undefined}
        >
          <PasswordInput
            id="confirm-password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
            error={!!(confirmPass && password !== confirmPass)}
          />
        </Field>

        {/* Terms */}
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-0.5 w-3.5 h-3.5 accent-emerald-500 shrink-0"
            required
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I agree to the{' '}
            <button type="button" className="text-primary hover:underline">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" className="text-primary hover:underline">
              Privacy Policy
            </button>
          </span>
        </label>

        {/* Error display */}
        {submitError && <ErrorAlert message={submitError} />}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10"
          disabled={isLoading || !agreedTerms}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <OrDivider />

      {/* Sign in link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors">
          Sign In
        </Link>
      </p>
    </AuthForm>
  );
}
