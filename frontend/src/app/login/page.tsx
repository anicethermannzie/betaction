'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { AuthForm, AuthInput, Field, OrDivider, ErrorAlert, SuccessAlert } from '@/components/auth/AuthForm';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [rememberMe,   setRememberMe]   = useState(false);
  const [registered,   setRegistered]   = useState(false);
  const [submitError,  setSubmitError]  = useState('');

  // Read ?registered=1 from the URL without useSearchParams (avoids Suspense)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('registered') === '1') setRegistered(true);
  }, []);

  // Sync store error → local display
  useEffect(() => {
    if (error) setSubmitError(error);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    clearError();
    try {
      await login(email, password);
    } catch {
      // error is already in store / submitError via useEffect
    }
  };

  return (
    <AuthForm
      title="Welcome Back"
      subtitle="Sign in to access your predictions"
    >
      {/* Registration success banner */}
      {registered && (
        <SuccessAlert message="Account created! Sign in to get started." />
      )}

      <form onSubmit={handleSubmit} className="space-y-4 mt-2">
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

        {/* Password */}
        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            placeholder="••••••••"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 accent-emerald-500 rounded"
            />
            <span className="text-xs text-muted-foreground">Remember me</span>
          </label>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => {}}
          >
            Forgot password?
          </button>
        </div>

        {/* Error display */}
        {submitError && <ErrorAlert message={submitError} />}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Signing in…
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <OrDivider />

      {/* Sign up link */}
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors">
          Sign Up
        </Link>
      </p>

      {/* Dev hint */}
      <p className="mt-4 text-center text-[11px] text-muted-foreground/40">
        Dev: use any email containing &quot;test&quot; to mock sign in
      </p>
    </AuthForm>
  );
}
