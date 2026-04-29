/*
 * SUPABASE DASHBOARD - REQUIRED SETTINGS:
 * Authentication -> URL Configuration -> Redirect URLs:
 * Add BOTH of these:
 *   http://localhost:3000
 *   http://localhost:3000/#/reset-password
 *
 * The reset email must be configured to redirect to:
 *   http://localhost:3000
 * NOT to http://localhost:3000/#/reset-password directly
 * because Supabase appends #access_token=... to the URL
 * and HashRouter cannot handle two # symbols.
 * App.tsx intercepts the token and redirects to /#/reset-password?token...
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getPasswordChecks, getPasswordScore, getPasswordStrengthLabel } from '../utils/passwordValidation';

type PageState = 'loading' | 'invalid' | 'form' | 'success';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  const [resetTokens, setResetTokens] = useState<{
    accessToken: string;
    refreshToken: string;
  } | null>(null);

  const checks = useMemo(() => getPasswordChecks(newPassword), [newPassword]);
  const score = useMemo(() => getPasswordScore(checks), [checks]);
  const strength = useMemo(() => getPasswordStrengthLabel(score), [score]);
  const allRulesPassed = score === 5;
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf('?');

    let tokenHash = '';
    let type = '';

    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.substring(qIndex + 1));
      tokenHash = params.get('token') || '';
      type = params.get('type') || '';
    }

    if (!tokenHash) {
      const params = new URLSearchParams(location.search);
      tokenHash = params.get('token') || '';
      type = params.get('type') || '';
    }

    if (!tokenHash || type !== 'recovery') {
      setPageState('invalid');
      return;
    }

    supabase?.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    }).then(({ error }) => {
      if (error) {
        setPageState('invalid');
      } else {
        setResetTokens({ accessToken: 'verified', refreshToken: '' });
        setPageState('form');
      }
    });
  }, [location.search]);

  useEffect(() => {
    if (pageState !== 'success' || countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown, pageState]);

  useEffect(() => {
    if (pageState === 'success' && countdown <= 0) {
      navigate('/login');
    }
  }, [countdown, navigate, pageState]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allRulesPassed || !passwordsMatch || !supabase) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      sessionStorage.removeItem('is_password_reset');
      await supabase.auth.signOut();
      setCountdown(3);
      setPageState('success');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden p-8 sm:p-10 text-center">
          <div className="mx-auto h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-text-muted text-sm mt-3">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden p-8 sm:p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300">
            <span className="material-symbols-outlined">close</span>
          </div>
          <p className="text-red-600 dark:text-red-300 font-semibold">Reset link is invalid or has expired.</p>
          <p className="text-text-muted text-sm mt-2">Reset links expire after 1 hour.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-5 w-full h-11 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
          >
            Request new reset link
          </button>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden p-8 sm:p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
            <span className="material-symbols-outlined">check</span>
          </div>
          <p className="text-emerald-700 dark:text-emerald-300 font-semibold">Password updated successfully!</p>
          <p className="text-text-muted text-sm mt-2">Redirecting to login in {countdown}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-[480px] bg-white dark:bg-surface-dark shadow-xl rounded-xl border border-gray-100 dark:border-white/10 overflow-hidden p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <h1 className="text-text-main dark:text-white text-2xl font-bold">Set new password</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-text-main dark:text-white text-sm font-semibold">New Password</span>
            <div className="relative">
              <input
                className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 h-12 px-4 pr-12"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  if (!passwordTouched) setPasswordTouched(true);
                  setNewPassword(e.target.value);
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </label>

          {passwordTouched ? (
            <>
              <div className="h-2 rounded-full bg-border-light dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    score <= 2 ? 'bg-red-500' : score === 3 ? 'bg-amber-500' : score === 4 ? 'bg-sky-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${(score / 5) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <span className={checks.minLength ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                  {checks.minLength ? '✓' : '✗'} Minimum 8 characters
                </span>
                <span className={checks.uppercase ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                  {checks.uppercase ? '✓' : '✗'} At least one uppercase letter
                </span>
                <span className={checks.lowercase ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                  {checks.lowercase ? '✓' : '✗'} At least one lowercase letter
                </span>
                <span className={checks.number ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                  {checks.number ? '✓' : '✗'} At least one number
                </span>
                <span className={checks.special ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                  {checks.special ? '✓' : '✗'} At least one special character (!@#$%^&*)
                </span>
              </div>
              <p className="text-xs text-text-muted">Strength: {strength}</p>
            </>
          ) : null}

          <label className="flex flex-col gap-1.5">
            <span className="text-text-main dark:text-white text-sm font-semibold">Confirm New Password</span>
            <div className="relative">
              <input
                className="w-full rounded-lg bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/20 h-12 px-4 pr-12"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              >
                <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </label>

          {!passwordsMatch && confirmPassword ? (
            <p className="text-xs text-red-600 dark:text-red-300">Passwords do not match.</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p> : null}

          <button
            type="submit"
            disabled={!allRulesPassed || !passwordsMatch || isSubmitting}
            className="mt-2 w-full h-12 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Updating...
              </span>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
