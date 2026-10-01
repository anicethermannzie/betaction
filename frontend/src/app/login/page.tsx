'use client';

import { useState } from 'react';
import { useHydrated } from '@/hooks/useHydrated';
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
  const hydrated = useHydrated();
  const registered = hydrated && new URLSearchParams(window.location.search).get('registered') === '1';
  const [submitError,  setSubmitError]  = useState('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    clearError();
    try {
      await login(email, password);
    } catch {
      // The store supplies the server error directly.
    }
  };

  return (
    <AuthForm
      title="Welcome Back"
      subtitle="Sign in to continue to MatchWise intelligence."
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
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {/* Error display */}
        {(submitError || error) && <ErrorAlert message={submitError || error || ''} />}

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary text-foreground font-semibold h-10"
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
        <Link href="/register" className="text-primary hover:text-primary font-semibold hover:underline transition-colors">
          Sign Up
        </Link>
      </p>

    </AuthForm>
  );
}


